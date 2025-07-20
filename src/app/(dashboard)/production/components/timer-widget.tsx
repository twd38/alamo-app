'use client';

import { useState, useEffect, useRef } from 'react';

function formatTime(timeInSeconds: number) {
  const hours = Math.floor(timeInSeconds / 60 / 60);
  const mins = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface TimerWidgetProps {
  startElapsedTime: number;
  stop?: boolean;
}

export function TimerWidget(props: TimerWidgetProps) {
  const { startElapsedTime, stop } = props;

  const [elapsedTime, setElapsedTime] = useState(startElapsedTime);
  const startTimeRef = useRef<number>(Date.now() - startElapsedTime * 1000);

  useEffect(() => {
    if (stop) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const newElapsedTime = Math.floor(
        (currentTime - startTimeRef.current) / 1000
      );
      setElapsedTime(newElapsedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [stop]);

  return (
    <div className="text-center">
      <div className="text-2xl font-mono font-bold">
        {formatTime(elapsedTime)}
      </div>
      <div className="text-xs opacity-90">Elapsed Time</div>
    </div>
  );
}
