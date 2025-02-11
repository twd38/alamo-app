import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "src/components/ui/card"
import { Avatar, AvatarFallback } from "src/components/ui/avatar"
import { Clock, Calendar, User2, Hash, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Job } from "@prisma/client"

interface TaskCardProps {
  job: Job
}

export function TaskCard({ job }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: job.id,
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
            <p className="text-sm text-muted-foreground">{job.jobNumber}</p>
            <h3 className="font-semibold">{job.partName}</h3>
          </div>
          <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">⋮</button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="aspect-square relative mb-4 rounded-md overflow-hidden border">
            <Image src={job.imageUrl || "/placeholder.svg"} alt={job.partName} fill className="object-cover" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span>{job.jobNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{job.operation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{job.timeEstimate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{job.dueDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              <span>{job.ownerId}</span>
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

