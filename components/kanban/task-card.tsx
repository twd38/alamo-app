import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Calendar, User2, Hash, AlertCircle } from "lucide-react"
import Image from "next/image"
import type { Task } from "app/types/kanban"

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
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
            <p className="text-sm text-muted-foreground">{task.jobNumber}</p>
            <h3 className="font-semibold">{task.partName}</h3>
          </div>
          <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">⋮</button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="aspect-square relative mb-4 rounded-md overflow-hidden border">
            <Image src={task.imageUrl || "/placeholder.svg"} alt={task.partName} fill className="object-cover" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span>{task.jobNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{task.operation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{task.timeEstimate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{task.dueDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              <span>{task.customer}</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Avatar className="h-6 w-6">
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">Unassigned</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

