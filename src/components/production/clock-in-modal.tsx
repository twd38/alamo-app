"use client"

import { useState, useCallback } from "react"
import { Scanner } from '@yudiel/react-qr-scanner'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserAccessList, type User } from "@/components/user-access-list"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/input"
import { Camera, AlertCircle, LogIn } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import useSWR from 'swr';

interface ClockInModalProps {
  workOrderId: string
  clockedInUsers: User[]
  onClockIn: (userId: string) => Promise<void>
}

export function ClockInModal({ workOrderId, clockedInUsers, onClockIn }: ClockInModalProps) {
  const [open, setOpen] = useState(false)
  const [scannedUsers, setScannedUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleScan = useCallback(async (result: IDetectedBarcode[]) => {
    if (!result?.[0]?.rawValue || isProcessing) return

    try {
      setIsProcessing(true)
      // Assuming the QR code contains a JSON string with user data
      const userData = JSON.parse(result[0].rawValue) as User
      
      // Check if user is already scanned
      if (scannedUsers.some(user => user.id === userData.id)) {
        toast.error("User already scanned")
        return
      }

      // Check if user is already clocked in
      if (clockedInUsers.some(user => user.id === userData.id)) {
        toast.error("User already clocked in")
        return
      }

      setScannedUsers(prev => [...prev, userData])
      toast.success("User scanned successfully")
    } catch (error) {
      // Only show error if it's not a parsing error (which is expected when no QR code is found)
      if (error instanceof SyntaxError) {
        return
      }
      toast.error("Invalid QR code format")
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, scannedUsers, clockedInUsers])

  const handleClockIn = async () => {
    if (scannedUsers.length === 0) return

    setIsLoading(true)
    try {
      // Clock in all scanned users
      await Promise.all(scannedUsers.map(user => onClockIn(user.id)))
      setScannedUsers([])
      toast.success("Successfully clocked in all users")
    } catch (error) {
      toast.error("Failed to clock in users")
    } finally {
      setIsLoading(false)
    }
  }

  const removeScannedUser = (userId: string) => {
    setScannedUsers(prev => prev.filter(user => user.id !== userId))
  }

  const handleError = useCallback((error: unknown) => {
    // Only log the error if it's not a common scanning error
    if (error instanceof Error && 
        !error.message.includes("No QR code found") && 
        !error.message.includes("selectBestPatterns")) {
      console.error("QR Scanner Error:", error)
      setCameraError("Failed to access camera. Please check your camera permissions.")
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2">
          <UserAccessList users={clockedInUsers} />
          <LogIn className="h-4 w-4" /> Clock In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clock In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* QR Scanner */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Scan QR Code</h3>
            <div className="aspect-square w-full overflow-hidden rounded-lg border">
              {cameraError ? (
                <Alert variant="destructive" className="h-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              ) : (
                <Scanner
                  constraints={{ 
                    facingMode: "environment",
                    width: { min: 360, ideal: 640, max: 1920 },
                    height: { min: 240, ideal: 480, max: 1080 }
                  }}
                  onScan={handleScan}
                  onError={handleError}
                  classNames={{
                    container: "w-full h-full"
                  }}
                  styles={{
                    video: { objectFit: "cover" }
                  }}
                  scanDelay={1000} // Increased delay between scans to reduce errors
                  allowMultiple
                />
              )}
            </div>
          </div>

          {/* Scanned Users List */}
          {scannedUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Scanned Users</h3>
              <div className="space-y-2">
                {scannedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback>
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScannedUser(user.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={handleClockIn} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Clocking in..." : `Clock In ${scannedUsers.length} User${scannedUsers.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}

          {/* Currently Clocked In Users */}
          {clockedInUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Currently Clocked In</h3>
              <UserAccessList users={clockedInUsers} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
