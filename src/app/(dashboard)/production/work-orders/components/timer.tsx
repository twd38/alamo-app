'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  initialElapsedTime: number;
  isRunning: boolean;
}

export function Timer({ initialElapsedTime, isRunning }: TimerProps) {
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime);

  const formatTime = (time: number) => {
    // time is in milliseconds
    const timeInSeconds = Math.floor(time / 1000);

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const secs = timeInSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setElapsedTime(initialElapsedTime);
  }, [initialElapsedTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1000); // Add 1000ms (1 second)
      }, 1000); // Update every second
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="text-center">
      <div className="text-2xl font-mono font-bold">
        {formatTime(elapsedTime)}
      </div>
      <div className="text-xs opacity-90">Elapsed Time</div>
    </div>
  );
}
