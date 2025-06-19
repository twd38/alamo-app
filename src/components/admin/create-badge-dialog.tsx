'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UserSelect } from '@/components/user-select'
import { Loader2 } from 'lucide-react'
import { createAccessBadge } from '@/lib/admin-actions'
import { UserWithoutBadge } from '@/lib/queries'
import { User } from '@prisma/client'

interface CreateBadgeDialogProps {
  isOpen: boolean
  onClose: () => void
  usersWithoutBadges: UserWithoutBadge[]
  onBadgeCreated: () => void
}

export function CreateBadgeDialog({ 
  isOpen, 
  onClose, 
  usersWithoutBadges, 
  onBadgeCreated 
}: CreateBadgeDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUserChange = (value: string | string[]) => {
    // Since we're not using multiSelect, value will be a string
    setSelectedUserId(value as string)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await createAccessBadge(selectedUserId)
      
      if (result.success) {
        onBadgeCreated()
        handleClose()
      } else {
        setError(result.error || 'Failed to create badge')
      }
    } catch (error) {
      console.error('Error creating badge:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUserId('')
    setError(null)
    onClose()
  }

  const selectedUser = usersWithoutBadges.find(user => user.id === selectedUserId)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Access Badge</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select User
            </label>
            <UserSelect
              users={usersWithoutBadges as any}
              value={selectedUserId}
              onChange={handleUserChange}
              placeholder="Select a user..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Only users without existing badges are shown
            </p>
          </div>

          {selectedUser && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Selected User:</p>
              <p className="text-sm text-muted-foreground">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedUserId}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Badge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 