import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NewWorkstationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewWorkstationDialog({ isOpen, onClose }: NewWorkstationDialogProps) {
  const [workstationName, setWorkstationName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({ workstationName, scheduledTime, status });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workstation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              placeholder="Workstation Name"
              value={workstationName}
              onChange={(e) => setWorkstationName(e.target.value)}
              required
            />
            <Input
              placeholder="Scheduled Time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
            <Input
              placeholder="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 