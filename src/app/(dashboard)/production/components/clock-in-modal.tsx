'use client';

import { useState, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatarList } from '@/components/ui/user-avatar-list';
import { toast } from 'sonner';
import { AlertCircle, LogIn, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAccessBadge } from '@/lib/queries';
import {
  clockInUsersToWorkOrder,
  clockOutUsersFromWorkOrder
} from '@/lib/actions';
import { User } from '@prisma/client';

interface ClockInModalProps {
  workOrderId: string;
  clockedInUsers: User[];
  disabled?: boolean;
}

export function ClockInModal(props: ClockInModalProps) {
  const { workOrderId, clockedInUsers, disabled = false } = props;

  const [open, setOpen] = useState(false);
  const [scannedUsers, setScannedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('clock-in');

  const handleScan = useCallback(
    async (result: IDetectedBarcode[]) => {
      if (!result?.[0]?.rawValue || isProcessing) return;

      console.log('Scanned result:', result);

      try {
        setIsProcessing(true);

        // Assuming the QR code contains the badge ID
        const badgeId = result[0].rawValue.trim();
        console.log('Scanned badge ID:', badgeId);

        // Fetch badge data using the query function
        const badge = await getAccessBadge(badgeId);
        console.log('Fetched badge:', badge);

        if (!badge) {
          toast.error('Invalid badge');
          return;
        }

        // Check if user is already clocked in
        if (clockedInUsers.some((user) => user.id === badge.user.id)) {
          toast.error('User already clocked in');
          return;
        }

        // Use functional update to check and add user atomically
        setScannedUsers((prev) => {
          console.log('Current scanned users:', prev);

          // Check if user is already scanned using current state
          if (prev.some((user) => user.id === badge.user.id)) {
            return prev; // Return unchanged state
          }

          // Add the new user
          toast.success(`${badge.user.name} scanned successfully`);
          return [...prev, badge.user];
        });
      } catch (error) {
        console.error('Badge scan error:', error);
        toast.error('Failed to verify badge');
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, clockedInUsers]
  );

  const handleClockIn = async () => {
    if (scannedUsers.length === 0) return;

    setIsLoading(true);
    try {
      // Clock in all scanned users using the action
      const userIds = scannedUsers.map((user) => user.id);
      const result = await clockInUsersToWorkOrder(userIds, workOrderId);

      if (result.success) {
        setScannedUsers([]);
        setOpen(false);
        toast.success('Successfully clocked in all users');
      } else {
        toast.error('Failed to clock in users');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      toast.error('Failed to clock in users');
    } finally {
      setIsLoading(false);
    }
  };

  const removeScannedUser = (userId: string) => {
    setScannedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleError = useCallback((error: unknown) => {
    // Only log the error if it's not a common scanning error
    if (
      error instanceof Error &&
      !error.message.includes('No QR code found') &&
      !error.message.includes('selectBestPatterns')
    ) {
      console.error('QR Scanner Error:', error);
      setCameraError(
        'Failed to access camera. Please check your camera permissions.'
      );
    }
  }, []);

  const handleClockOut = async (userId: string) => {
    setIsClockingOut(true);
    try {
      const result = await clockOutUsersFromWorkOrder([userId], workOrderId);

      if (result.success) {
        toast.success('Successfully clocked out user');
      } else {
        toast.error('Failed to clock out user');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error('Failed to clock out user');
    } finally {
      setIsClockingOut(false);
    }
  };

  const openClockInModal = () => {
    setActiveTab('clock-in');
    setOpen(true);
  };

  const openClockOutModal = () => {
    setActiveTab('clock-out');
    setOpen(true);
  };

  return (
    <>
      {clockedInUsers.length > 0 ? (
        <UserAvatarList
          users={clockedInUsers}
          actionButton={{
            icon: <LogIn className="h-3 w-3" />,
            tooltip: disabled
              ? 'Cannot clock in/out while work order is in progress'
              : clockedInUsers.length > 0
                ? 'Clock In/Out'
                : 'Clock In',
            onClick: openClockOutModal,
            disabled: disabled
          }}
        />
      ) : (
        <Button
          variant="secondary"
          onClick={openClockInModal}
          disabled={disabled}
          title={
            disabled
              ? 'Cannot clock in while work order is in progress'
              : undefined
          }
        >
          <LogIn className="h-4 w-4 mr-2" />
          Clock In
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:w-[425px]">
          <DialogHeader>
            <DialogTitle>Clock In / Out</DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full ">
              <TabsTrigger
                value="clock-in"
                className="flex items-center gap-2 w-full"
              >
                <LogIn className="h-4 w-4" />
                Clock In
              </TabsTrigger>
              <TabsTrigger
                value="clock-out"
                className="flex items-center gap-2 w-full"
              >
                <LogOut className="h-4 w-4" />
                Clock Out
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clock-in" className="space-y-4 min-h-[400px]">
              {/* QR Scanner */}
              <div className="space-y-2">
                <div className="aspect-square w-full overflow-hidden rounded-lg border">
                  {cameraError ? (
                    <Alert
                      variant="destructive"
                      className="h-full flex items-center justify-center"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>{cameraError}</AlertDescription>
                    </Alert>
                  ) : (
                    <Scanner
                      constraints={{
                        facingMode: 'environment',
                        width: { min: 360, ideal: 640, max: 1920 },
                        height: { min: 240, ideal: 480, max: 1080 }
                      }}
                      onScan={handleScan}
                      onError={handleError}
                      classNames={{
                        container: 'w-full h-full'
                      }}
                      styles={{
                        video: { objectFit: 'cover' }
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
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
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
                      {isLoading
                        ? 'Clocking in...'
                        : `Clock In ${scannedUsers.length} User${scannedUsers.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="clock-out" className="space-y-4 min-h-[400px]">
              {/* Currently Clocked In Users */}
              {clockedInUsers.length > 0 ? (
                <div className="space-y-2">
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {clockedInUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClockOut(user.id)}
                          disabled={isClockingOut}
                          className="flex items-center gap-2"
                        >
                          <LogOut className="h-3 w-3" />
                          {isClockingOut ? 'Clocking out...' : 'Clock Out'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8 flex flex-col items-center justify-center h-full">
                  <LogOut className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users currently clocked in</p>
                  <p className="text-sm">Use the Clock In tab to scan users</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
