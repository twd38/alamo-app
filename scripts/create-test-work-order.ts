import { PrismaClient, WorkOrderStatus, OperationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestWorkOrder() {
  try {
    // Get the part with routing
    const part = await prisma.part.findFirst({
      where: {
        partNumber: '019679'
      },
      include: {
        routings: {
          where: { isActive: true },
          include: {
            steps: {
              include: {
                operation: true,
                workCenter: true
              },
              orderBy: { stepNumber: 'asc' }
            }
          }
        }
      }
    });

    if (!part) {
      console.error('Part not found');
      return;
    }

    const routing = part.routings[0];
    if (!routing) {
      console.error('No active routing found for part');
      return;
    }

    // Get a user to assign
    const user = await prisma.user.findFirst({
      where: {
        email: 'will@americanhousing.co'
      }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    // Generate work order number
    const lastWO = await prisma.workOrder.findFirst({
      orderBy: { workOrderNumber: 'desc' },
      select: { workOrderNumber: true }
    });
    const lastSeq = lastWO?.workOrderNumber?.replace(/[^0-9]/g, '') || '0';
    const nextSeq = String(Number(lastSeq) + 1).padStart(6, '0');
    const workOrderNumber = `WO-${nextSeq}`;

    console.log('Creating work order:', workOrderNumber);

    // Create work order with routing and operations
    const result = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          workOrderNumber,
          operation: 'Routing-based Manufacturing',
          status: WorkOrderStatus.TODO,
          dueDate: new Date('2025-08-15'),
          createdById: user.id,
          partId: part.id,
          partQty: 2,
          notes: 'Test work order for Phase 3 MES Evolution',
          assignees: {
            create: [{ userId: user.id }]
          }
        }
      });

      const workOrderRouting = await tx.workOrderRouting.create({
        data: {
          workOrderId: workOrder.id,
          routingId: routing.id,
          operations: {
            create: routing.steps.map(step => ({
              sequenceNumber: step.stepNumber,
              operationId: step.operationId,
              workCenterId: step.workCenterId,
              status: OperationStatus.PENDING,
              plannedQty: 2,
              plannedSetupTime: step.setupTime,
              plannedRunTime: step.runTime * 2,
              assignedUserId: user.id,
              priority: step.stepNumber === 1 ? 1 : 0
            }))
          }
        },
        include: {
          operations: {
            include: {
              operation: true,
              workCenter: true
            }
          }
        }
      });

      return { workOrder, workOrderRouting };
    });

    console.log('Work order created successfully:', result.workOrder.workOrderNumber);
    console.log('Operations created:', result.workOrderRouting.operations.length);
    
    result.workOrderRouting.operations.forEach(op => {
      console.log(`  - ${op.operation.name} at ${op.workCenter.name}`);
    });

  } catch (error) {
    console.error('Error creating test work order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWorkOrder();