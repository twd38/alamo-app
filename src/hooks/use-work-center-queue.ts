'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface QueueStats {
  queueLength: number;
  activeOperations: number;
  completedToday: number;
}

interface QueueUpdate {
  type: string;
  timestamp: string;
  queueEntries: any[];
  stats: QueueStats;
}

export function useWorkCenterQueue(workCenterId: string) {
  const [queueData, setQueueData] = useState<QueueUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const eventSource = new EventSource(
        `/api/sse/work-center-queue/${workCenterId}`
      );

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log('SSE connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('Connected to work center queue:', data.workCenterId);
          } else if (data.type === 'queue-update') {
            setQueueData(data);
            
            // Check if any operations became ready since last update
            if (queueData && data.queueEntries.length > queueData.queueEntries.length) {
              const newReadyOps = data.queueEntries.filter(
                (entry: any) => entry.operation.readiness?.isReady === true
              ).length;
              const oldReadyOps = queueData.queueEntries.filter(
                (entry: any) => entry.operation.readiness?.isReady === true
              ).length;
              
              if (newReadyOps > oldReadyOps) {
                toast.success('New operation ready in queue!');
              }
            }
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        setError('Connection lost. Reconnecting...');
        eventSource.close();
        
        // Exponential backoff for reconnection
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Error creating SSE connection:', err);
      setError('Failed to connect to updates');
      setIsConnected(false);
    }
  }, [workCenterId, queueData]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    queueData,
    isConnected,
    error,
    reconnect: connect,
    disconnect
  };
}