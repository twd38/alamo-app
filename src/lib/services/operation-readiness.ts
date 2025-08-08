import { prisma } from '@/lib/db';
import { 
  OperationStatus, 
  DependencyType, 
  BlockedReason,
  type WorkOrderOperation,
  type OperationDependency,
  type OperationReadiness
} from '@prisma/client';
import { NotificationService } from './notification-service';

interface ReadinessCheck {
  isReady: boolean;
  blockedReasons: BlockedReason[];
  estimatedWaitTime?: number;
}

interface OperationWithDependencies extends WorkOrderOperation {
  dependencies: (OperationDependency & {
    dependsOnOperation: WorkOrderOperation;
  })[];
  prerequisites: (OperationDependency & {
    operation: WorkOrderOperation;
  })[];
  readiness?: OperationReadiness | null;
}

export class OperationReadinessService {
  /**
   * Calculate readiness for a single operation
   */
  static async calculateReadiness(
    operationId: string
  ): Promise<ReadinessCheck> {
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId },
      include: {
        dependencies: {
          include: {
            dependsOnOperation: true
          }
        },
        workCenter: true,
        assignedUser: true
      }
    });

    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const blockedReasons: BlockedReason[] = [];
    let estimatedWaitTime = 0;

    // Check 1: Dependencies
    const dependencyCheck = await this.checkDependencies(operation.dependencies);
    if (!dependencyCheck.isReady) {
      blockedReasons.push(...dependencyCheck.blockedReasons);
      estimatedWaitTime = Math.max(estimatedWaitTime, dependencyCheck.estimatedWaitTime || 0);
    }

    // Check 2: Material availability
    const materialCheck = await this.checkMaterialAvailability(operation);
    if (!materialCheck.isReady) {
      blockedReasons.push(BlockedReason.MATERIAL_UNAVAILABLE);
    }

    // Check 3: Work center availability
    const workCenterCheck = await this.checkWorkCenterAvailability(operation);
    if (!workCenterCheck.isReady) {
      blockedReasons.push(BlockedReason.WORK_CENTER_BUSY);
      estimatedWaitTime = Math.max(estimatedWaitTime, workCenterCheck.estimatedWaitTime || 0);
    }

    // Check 4: Worker assignment
    if (!operation.assignedUserId) {
      blockedReasons.push(BlockedReason.OPERATOR_UNAVAILABLE);
    }

    // Check 5: Tooling/Fixtures availability
    const toolingCheck = await this.checkToolingAvailability(operation);
    if (!toolingCheck.isReady) {
      blockedReasons.push(BlockedReason.TOOL_UNAVAILABLE);
    }

    const isReady = blockedReasons.length === 0;

    // Update the readiness record
    await this.updateReadinessRecord(operationId, isReady, blockedReasons, estimatedWaitTime);

    return {
      isReady,
      blockedReasons,
      estimatedWaitTime: isReady ? undefined : estimatedWaitTime
    };
  }

  /**
   * Check if all dependencies are satisfied
   */
  private static async checkDependencies(
    dependencies: (OperationDependency & { dependsOnOperation: WorkOrderOperation })[]
  ): Promise<ReadinessCheck> {
    const blockedReasons: BlockedReason[] = [];
    let maxWaitTime = 0;

    for (const dep of dependencies) {
      const { dependsOnOperation, dependencyType, lagTime } = dep;

      switch (dependencyType) {
        case DependencyType.FINISH_TO_START:
          // Most common: current can't start until dependency finishes
          if (dependsOnOperation.status !== OperationStatus.COMPLETED) {
            blockedReasons.push(BlockedReason.WAITING_PREDECESSOR);
            
            // Estimate wait time based on dependency's estimated duration
            if (dependsOnOperation.plannedRunTime) {
              const waitTime = dependsOnOperation.plannedRunTime + (lagTime || 0);
              maxWaitTime = Math.max(maxWaitTime, waitTime);
            }
          }
          break;

        case DependencyType.START_TO_START:
          // Current can't start until dependency starts
          if (dependsOnOperation.status === OperationStatus.PENDING) {
            blockedReasons.push(BlockedReason.WAITING_PREDECESSOR);
          }
          break;

        case DependencyType.FINISH_TO_FINISH:
          // Current can't finish until dependency finishes
          // This doesn't block starting, so no blocking reason here
          break;

        case DependencyType.START_TO_FINISH:
          // Rare: current can't finish until dependency starts
          // This doesn't block starting, so no blocking reason here
          break;
      }
    }

    return {
      isReady: blockedReasons.length === 0,
      blockedReasons,
      estimatedWaitTime: maxWaitTime
    };
  }

  /**
   * Check material availability for the operation
   */
  private static async checkMaterialAvailability(
    operation: any
  ): Promise<ReadinessCheck> {
    // TODO: Implement actual material checking logic
    // This would check inventory levels against BOM requirements
    // For now, assume materials are available
    return {
      isReady: true,
      blockedReasons: []
    };
  }

  /**
   * Check if the work center is available
   */
  private static async checkWorkCenterAvailability(
    operation: any
  ): Promise<ReadinessCheck> {
    if (!operation.workCenterId) {
      return {
        isReady: true,
        blockedReasons: []
      };
    }

    // Check if there are operations currently running at this work center
    const activeOperations = await prisma.workOrderOperation.count({
      where: {
        workCenterId: operation.workCenterId,
        status: {
          in: [OperationStatus.SETUP, OperationStatus.RUNNING]
        },
        id: {
          not: operation.id
        }
      }
    });

    if (activeOperations > 0) {
      // Estimate wait time based on queue
      const queuedOperations = await prisma.workOrderOperation.findMany({
        where: {
          workCenterId: operation.workCenterId,
          status: OperationStatus.PENDING,
          id: {
            not: operation.id
          }
        },
        select: {
          plannedRunTime: true
        }
      });

      const estimatedWaitTime = queuedOperations.reduce(
        (sum, op) => sum + (op.plannedRunTime || 0),
        0
      );

      return {
        isReady: false,
        blockedReasons: [],
        estimatedWaitTime
      };
    }

    return {
      isReady: true,
      blockedReasons: []
    };
  }

  /**
   * Check tooling/fixture availability
   */
  private static async checkToolingAvailability(
    operation: any
  ): Promise<ReadinessCheck> {
    // TODO: Implement tooling check logic
    // This would check if required tools/fixtures are available
    // For now, assume tools are available
    return {
      isReady: true,
      blockedReasons: []
    };
  }

  /**
   * Update or create the readiness record
   */
  private static async updateReadinessRecord(
    operationId: string,
    isReady: boolean,
    blockedReasons: BlockedReason[],
    estimatedWaitTime?: number
  ): Promise<void> {
    // Get previous readiness state
    const previousReadiness = await prisma.operationReadiness.findUnique({
      where: { workOrderOperationId: operationId }
    });

    const wasReady = previousReadiness?.isReady || false;

    // Update the record
    await prisma.operationReadiness.upsert({
      where: {
        workOrderOperationId: operationId
      },
      create: {
        workOrderOperationId: operationId,
        isReady,
        blockedReasons,
        lastCalculated: new Date()
      },
      update: {
        isReady,
        blockedReasons,
        lastCalculated: new Date()
      }
    });

    // Send notification if operation just became ready
    if (!wasReady && isReady) {
      await NotificationService.notifyOperationReady(operationId);
    }
  }

  /**
   * Calculate readiness for all operations in a work order
   */
  static async calculateWorkOrderReadiness(
    workOrderId: string
  ): Promise<Map<string, ReadinessCheck>> {
    const operations = await prisma.workOrderOperation.findMany({
      where: {
        workOrderRouting: {
          workOrderId
        }
      },
      include: {
        dependencies: {
          include: {
            dependsOnOperation: true
          }
        }
      }
    });

    const readinessMap = new Map<string, ReadinessCheck>();

    for (const operation of operations) {
      const readiness = await this.calculateReadiness(operation.id);
      readinessMap.set(operation.id, readiness);
    }

    return readinessMap;
  }

  /**
   * Get operations ready for execution at a specific work center
   */
  static async getReadyOperations(
    workCenterId: string
  ): Promise<OperationWithDependencies[]> {
    const operations = await prisma.workOrderOperation.findMany({
      where: {
        workCenterId,
        status: OperationStatus.PENDING
      },
      include: {
        dependencies: {
          include: {
            dependsOnOperation: true
          }
        },
        prerequisites: {
          include: {
            operation: true
          }
        },
        readiness: true,
        workOrderRouting: {
          include: {
            workOrder: {
              include: {
                part: true
              }
            }
          }
        }
      }
    });

    // Filter to only ready operations
    const readyOperations: OperationWithDependencies[] = [];
    
    for (const operation of operations) {
      const readiness = await this.calculateReadiness(operation.id);
      if (readiness.isReady) {
        readyOperations.push(operation);
      }
    }

    // Sort by priority and due date
    readyOperations.sort((a, b) => {
      // First by priority (higher priority first)
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date (earlier due date first)
      const aDueDate = (a as any).workOrderRouting?.workOrder?.dueDate;
      const bDueDate = (b as any).workOrderRouting?.workOrder?.dueDate;
      
      if (aDueDate && bDueDate) {
        return aDueDate.getTime() - bDueDate.getTime();
      }
      
      return 0;
    });

    return readyOperations;
  }

  /**
   * Recalculate readiness when an operation status changes
   */
  static async onOperationStatusChange(
    operationId: string
  ): Promise<void> {
    // Get all operations that depend on this one
    const dependentOperations = await prisma.operationDependency.findMany({
      where: {
        dependsOnOperationId: operationId
      },
      select: {
        workOrderOperationId: true
      }
    });

    // Recalculate readiness for all dependent operations
    for (const dep of dependentOperations) {
      await this.calculateReadiness(dep.workOrderOperationId);
    }

    // Also update queue positions if needed
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId }
    });

    if (operation?.workCenterId) {
      await this.updateWorkCenterQueue(operation.workCenterId);
    }
  }

  /**
   * Update the queue for a work center
   */
  static async updateWorkCenterQueue(
    workCenterId: string
  ): Promise<void> {
    // Get all ready operations for this work center
    const readyOperations = await this.getReadyOperations(workCenterId);

    // Clear existing queue entries for this work center
    await prisma.workCenterQueue.deleteMany({
      where: { workCenterId }
    });

    // Create new queue entries
    const queueEntries = readyOperations.map((op, index) => ({
      workCenterId,
      operationId: op.id,
      queuePosition: index + 1,
      priority: op.priority || 0,
      estimatedWaitTime: this.calculateQueueWaitTime(readyOperations, index)
    }));

    if (queueEntries.length > 0) {
      await prisma.workCenterQueue.createMany({
        data: queueEntries
      });
    }
  }

  /**
   * Calculate estimated wait time for a position in queue
   */
  private static calculateQueueWaitTime(
    operations: OperationWithDependencies[],
    position: number
  ): number {
    let waitTime = 0;
    
    for (let i = 0; i < position; i++) {
      waitTime += operations[i].plannedRunTime || 0;
      waitTime += operations[i].plannedSetupTime || 0;
    }
    
    return waitTime;
  }
}