"use client"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "src/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "src/components/ui/avatar"
import { Clock, Calendar, User2, Hash, AlertCircle, Tag } from "lucide-react"
import { Badge } from "src/components/ui/badge"
import Image from "next/image"
import { Prisma } from "@prisma/client"
import { useAtom } from "jotai"
import { taskModal } from "@/components/board/utils"
import { getStatusConfig } from "@/lib/utils"

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    assignees: true
    createdBy: true
    files: true
    tags: true
  }
}>

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const [_, setActiveTask] = useAtom(taskModal);
  
  if (!task) return null;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when dragging
    if (transform) return;
    
    // Don't open task detail if clicking the menu button
    if ((e.target as HTMLElement).closest('button')) return;
    
    setActiveTask({
      type: "edit",
      taskId: task.id,
      kanbanSectionId: task.kanbanSectionId,
    });
  };

  return (
      <Card 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes} 
        className="cursor-pointer"
        onClick={handleClick}
      >
        <CardHeader className="p-4 flex flex-row justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{task.taskNumber}</p>
            <h3 className="font-semibold">{task.name}</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {/* <div className="aspect-square relative mb-4 rounded-md overflow-hidden border">
            <Image src={ "/placeholder.svg"} alt={task.name} fill className="object-cover" />
          </div> */}
          <div className="space-y-3 text-sm">
            {/* <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span>{task.taskNumber}</span>
            </div> */}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {
                task.tags.map((tag) => (
                  <Badge key={tag.id} className={`bg-${tag.color}-500`}>{tag.name}</Badge>
                ))
              }
            </div>
        
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{task.dueDate.toLocaleDateString()}</span>
            </div>
            {/* <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              <span>{task.createdBy.name}</span>
            </div> */}
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              {task.assignees.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {task.assignees.map((assignee) => (
                      <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={assignee.image || ""} />
                        <AvatarFallback>{assignee.name?.[0]}</AvatarFallback>
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
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">Unassigned</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
  )
}

