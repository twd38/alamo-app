"use client"

import { Card, CardContent } from "src/components/ui/card"
import { useState, useEffect } from "react"

interface CountdownProps {
  targetDate: Date
}

const useCountdown = (targetDate: Date) => {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearTimeout(timer)
  })

  return timeLeft
}


export function Countdown({ targetDate }: CountdownProps) {
  const timeLeft = useCountdown(targetDate)

  return (
    <Card className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Time Until Launch</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="text-center">
              <div className="bg-[hsl(var(--card))] rounded-lg p-4">
                <span className="text-3xl font-bold text-[hsl(var(--card-foreground))]">{String(value).padStart(2, "0")}</span>
                <span className="block text-sm text-[hsl(var(--muted-foreground))] mt-1 uppercase">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

