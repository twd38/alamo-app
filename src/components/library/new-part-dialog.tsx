'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import NewPartForm from './new-part-form';

export const NewPartDialog = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
    }
    if (open) {
      setIsOpen(true);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Part
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-[90vw] sm:max-w-[700px] p-0 flex flex-col h-full">
        <SheetHeader className="px-4 py-2 border-b">
          <SheetTitle>Create New Part</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-4 flex-1">
          <NewPartForm />
        </div>
        <SheetFooter></SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
