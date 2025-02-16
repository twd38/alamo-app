"use client"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "src/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "src/components/ui/avatar"
import { Clock, Calendar, User2, Hash, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Task, User, File } from "@prisma/client"
import { Prisma } from "@prisma/client"

interface TaskCardProps {
  task: Task & {
    assignees: User[]
    createdBy: User
    files: File[]
  }
}

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    assignees: true
    createdBy: true
    files: true
  }
}>

export function TaskCard({ task }: { task: TaskWithRelations }) {
  // console.log(task)
  if (!task) return null;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="bg-white dark:bg-gray-700 text-black dark:text-white">
      <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-4">
        <CardHeader className="p-4 flex flex-row justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{task.taskNumber}</p>
            <h3 className="font-semibold">{task.name}</h3>
          </div>
          <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">⋮</button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="aspect-square relative mb-4 rounded-md overflow-hidden border">
            <Image src={ "/placeholder.svg"} alt={task.name} fill className="object-cover" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span>{task.taskNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{task.status}</span>
            </div>
        
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{task.dueDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              <span>{task.createdBy.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {task.assignees.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {task.assignees.map((assignee) => (
                      <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={assignee.image || ""} />
                        <AvatarFallback>
                          {assignee.name?.split(' ').map(word => word[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    {task.assignees.length === 1 
                      ? task.assignees[0].name 
                      : `${task.assignees.length} assignees`}
                  </span>
                </>
              ) : (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">Unassigned</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

