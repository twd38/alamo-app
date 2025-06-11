"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PlayIcon, PauseIcon } from "lucide-react"
import { TimerWidget } from "./timer-widget"
// import { ActionGates } from "./action-gates"
// import { NotesModal } from "./notes-modal"
import { getWorkOrder } from "@/lib/queries"
import { Prisma, User, WorkOrderStatus } from "@prisma/client"
import { cn } from "@/lib/utils"
import { ClockInModal } from "./clock-in-modal"
type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>

interface WorkOrderExecutionProps {
  workOrder: WorkOrder
}

const StartStopButton = ({ status }: { status: WorkOrderStatus }) => {
    if (status === WorkOrderStatus.PAUSED || status === WorkOrderStatus.TODO) {
        return (
            <Button variant="secondary" className="flex items-center w-24">
                <PlayIcon className="w-4 h-4 mr-2" />
                Start
            </Button>
        )
    }

    if (status === WorkOrderStatus.IN_PROGRESS) {
        return (
            <Button variant="secondary" className="flex items-center w-24">
                <PauseIcon className="w-4 h-4 mr-2" />
                Pause
            </Button>
        )
    }

    return <></>
}

export function ProductionTopBar({ workOrder }: WorkOrderExecutionProps) {
    if (!workOrder) return null

    const [isRunning, setIsRunning] = useState(workOrder.status === "IN_PROGRESS")
    const [currentStep, setCurrentStep] = useState(0)
    const [elapsedTime, setElapsedTime] = useState(0)

    const steps = workOrder.part.workInstructions[0].steps
    const totalSteps = steps.length
    const progressPercentage = Math.round(currentStep / totalSteps * 100)

    const workOrderStatus = workOrder.status

    // Get the total time estimate for the work order by summing the time estimate for each step
    const timeEstimate = steps.reduce((acc, step) => acc + step.estimatedLabourTime, 0)
    
    const getTimeStatus = () => {
        const percentage = (elapsedTime / timeEstimate) * 100
        if (percentage < 80) return "on-time"
        if (percentage < 100) return "warning"
        return "overdue"
    }
    
    const getTimeStatusColor = () => {
        const status = getTimeStatus()
        if(workOrderStatus !== WorkOrderStatus.IN_PROGRESS) return "bg-green-500"
        switch (status) {
            case "on-time":
            return "bg-green-500"
            case "warning":
            return "bg-yellow-500"
            case "overdue":
            return "bg-red-500"
            default:
            return "bg-gray-400"
        }
    }

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
    }
    
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRunning) {
          interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1)
          }, 60000) // Update every minute
        }
        return () => clearInterval(interval)
      }, [isRunning])

    return (
        <div className={cn("p-4 text-white space-y-4", getTimeStatusColor())}>
            <div className="flex justify-between items-center">
                {/* Part Info */}
                <div className="">
                    <h1 className="text-xl font-bold">{workOrder.part.name}</h1>
                    <p className="text-sm opacity-90">
                        {workOrder.part.partNumber}/{workOrder.part.partRevision} • Qty: {workOrder.partQty}
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    {/* Time Tracking */}
                    <div className="text-center">
                        <div className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</div>
                        <div className="text-xs opacity-90">Elapsed Time</div>
                    </div>

                    {/* Start/Stop Button */}
                    <StartStopButton status={workOrderStatus} />

                    {/* Clocked in Users */}
                    <div className="flex items-center gap-2"> 
                        <ClockInModal workOrderId={workOrder.id} clockedInUsers={[]} onClockIn={async () => {console.log("Clocked in")}} />
                    </div>
                </div>
                
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Step {currentStep} of {totalSteps}</span>
                    <span className="text-sm opacity-90">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
            </div>
        </div>
    )
}
