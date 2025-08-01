'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface CountdownProps {
  targetDate: string | Date;
}

type TimeLeft = {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
};

const DEFAULT_TIME_LEFT: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
} as const;

export default function Countdown({ targetDate }: CountdownProps) {
  const parsedTargetDate: Date = useMemo(
    () => (typeof targetDate === 'string' ? new Date(targetDate) : targetDate),
    [targetDate]
  );

  const calculateTimeLeft = useCallback((): TimeLeft => {
    const difference: number = +parsedTargetDate - +new Date();

    if (difference <= 0) {
      return DEFAULT_TIME_LEFT;
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }, [parsedTargetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(DEFAULT_TIME_LEFT);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const intervalId: NodeJS.Timeout = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [calculateTimeLeft]);

  return (
    <Card className="">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Countdown to Demostration Unit Completion
        </h2>
        <div className="grid grid-cols-4 gap-8">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="flex flex-col items-center w-full">
              <div className="text-center border-2 bg-muted border-primary/10 rounded-lg py-4 md:py-10 w-full">
                <span className="text-xl md:text-5xl font-bold">
                  {String(value).padStart(2, '0')}
                </span>
              </div>
              <span className="block text-xs md:text-sm font-medium text-primary/80 mt-3 uppercase">
                {unit}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
