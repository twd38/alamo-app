'use client'

import { cn } from "src/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "src/components/ui/alert-dialog"

interface DeleteAlertProps {
  isOpen: boolean
  onCloseAction: () => void
  onConfirm: () => void
  resourceName: string
}

export function DeleteAlert({ isOpen, onCloseAction, onConfirm, resourceName }: DeleteAlertProps) {
//   console.log(isOpen)

  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onCloseAction} >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this {resourceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the {resourceName}
             and remove the data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-no-dnd>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn("bg-red-600 hover:bg-red-700 focus:ring-red-500", "text-white font-semibold")}
            data-no-dnd
            onClick={handleConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

