import { prisma } from '@/lib/db';

export enum NotificationType {
  OPERATION_READY = 'OPERATION_READY',
  OPERATION_ASSIGNED = 'OPERATION_ASSIGNED',
  HIGH_PRIORITY = 'HIGH_PRIORITY',
  WORK_CENTER_AVAILABLE = 'WORK_CENTER_AVAILABLE',
  DEPENDENCY_CLEARED = 'DEPENDENCY_CLEARED',
  QUEUE_POSITION_CHANGED = 'QUEUE_POSITION_CHANGED'
}

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  workOrderId?: string;
  operationId?: string;
  workCenterId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  static async notifyUser(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      // Store notification in database
      await this.storeNotification(userId, notification);

      // If user has push notifications enabled, send push notification
      const userPreferences = await this.getUserNotificationPreferences(userId);
      
      if (userPreferences?.pushEnabled) {
        await this.sendPushNotification(userId, notification);
      }

      // If user has email notifications enabled for this type
      if (userPreferences?.emailEnabled && this.shouldSendEmail(notification.type)) {
        await this.queueEmailNotification(userId, notification);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Notify all workers assigned to a work center
   */
  static async notifyWorkCenterWorkers(
    workCenterId: string,
    notification: NotificationData
  ): Promise<void> {
    // Get all workers with active operations at this work center
    const workers = await prisma.user.findMany({
      where: {
        assignedOperations: {
          some: {
            workCenterId,
            status: {
              in: ['PENDING', 'SETUP', 'RUNNING', 'PAUSED']
            }
          }
        }
      },
      select: { id: true }
    });

    // Send notification to each worker
    await Promise.all(
      workers.map(worker => this.notifyUser(worker.id, notification))
    );
  }

  /**
   * Notify when an operation becomes ready
   */
  static async notifyOperationReady(operationId: string): Promise<void> {
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId },
      include: {
        operation: true,
        workCenter: true,
        assignedUser: true,
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

    if (!operation) return;

    const notification: NotificationData = {
      type: NotificationType.OPERATION_READY,
      title: 'Operation Ready',
      message: `${operation.operation.name} for WO ${operation.workOrderRouting.workOrder.workOrderNumber} is ready to start`,
      operationId,
      workOrderId: operation.workOrderRouting.workOrderId,
      workCenterId: operation.workCenterId,
      priority: operation.priority > 5 ? 'urgent' : operation.priority > 0 ? 'high' : 'medium',
      actionUrl: `/production/${operation.workOrderRouting.workOrderId}`
    };

    // Notify assigned user if exists
    if (operation.assignedUserId) {
      await this.notifyUser(operation.assignedUserId, notification);
    }

    // Also notify all workers at the work center
    await this.notifyWorkCenterWorkers(operation.workCenterId, notification);
  }

  /**
   * Notify when a high priority operation enters the queue
   */
  static async notifyHighPriorityOperation(operationId: string): Promise<void> {
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId },
      include: {
        operation: true,
        workCenter: true,
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

    if (!operation || operation.priority <= 5) return;

    const notification: NotificationData = {
      type: NotificationType.HIGH_PRIORITY,
      title: 'High Priority Operation',
      message: `URGENT: ${operation.operation.name} for ${operation.workOrderRouting.workOrder.part.partNumber} needs immediate attention`,
      operationId,
      workOrderId: operation.workOrderRouting.workOrderId,
      workCenterId: operation.workCenterId,
      priority: 'urgent',
      actionUrl: `/production/${operation.workOrderRouting.workOrderId}`
    };

    await this.notifyWorkCenterWorkers(operation.workCenterId, notification);
  }

  /**
   * Store notification in database for later retrieval
   */
  private static async storeNotification(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    // This would store in a Notification table
    // For now, we'll just log it
    console.log(`Notification for user ${userId}:`, notification);
  }

  /**
   * Get user's notification preferences
   */
  private static async getUserNotificationPreferences(userId: string): Promise<any> {
    // This would fetch from a UserPreferences table
    // For now, return default preferences
    return {
      pushEnabled: true,
      emailEnabled: false,
      soundEnabled: true
    };
  }

  /**
   * Send push notification to user's device
   */
  private static async sendPushNotification(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    // This would integrate with a push notification service
    // like Firebase Cloud Messaging or OneSignal
    console.log(`Push notification would be sent to user ${userId}`);
  }

  /**
   * Queue email notification
   */
  private static async queueEmailNotification(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    // This would queue an email job
    console.log(`Email notification queued for user ${userId}`);
  }

  /**
   * Determine if email should be sent for this notification type
   */
  private static shouldSendEmail(type: NotificationType): boolean {
    // Only send emails for urgent notifications
    return type === NotificationType.HIGH_PRIORITY;
  }
}