import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OperationStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workCenterId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { workCenterId } = await params;

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const message = `data: ${JSON.stringify({ type: 'connected', workCenterId })}\n\n`;
      controller.enqueue(encoder.encode(message));

      // Function to send queue updates
      const sendQueueUpdate = async () => {
        try {
          // Get queue entries with readiness info
          const queueEntries = await prisma.workCenterQueue.findMany({
            where: { workCenterId },
            include: {
              operation: {
                include: {
                  operation: true,
                  workOrderRouting: {
                    include: {
                      workOrder: {
                        include: {
                          part: true
                        }
                      }
                    }
                  },
                  assignedUser: true,
                  readiness: true
                }
              }
            },
            orderBy: { queuePosition: 'asc' }
          });

          // Get active operations
          const activeOperations = await prisma.workOrderOperation.count({
            where: {
              workCenterId,
              status: {
                in: [OperationStatus.SETUP, OperationStatus.RUNNING]
              }
            }
          });

          // Get completed today count
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const completedToday = await prisma.workOrderOperation.count({
            where: {
              workCenterId,
              status: OperationStatus.COMPLETED,
              completedAt: {
                gte: today
              }
            }
          });

          const data = {
            type: 'queue-update',
            timestamp: new Date().toISOString(),
            queueEntries,
            stats: {
              queueLength: queueEntries.length,
              activeOperations,
              completedToday
            }
          };

          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending queue update:', error);
        }
      };

      // Send initial data
      await sendQueueUpdate();

      // Set up polling interval (every 5 seconds)
      intervalId = setInterval(sendQueueUpdate, 5000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        controller.close();
      });
    },

    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}