import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface User {
  id: string
  name: string
  email: string
  image?: string | null
}

interface ActionButton {
  icon: React.ReactNode
  tooltip?: string
  onClick?: () => void
  disabled?: boolean
}

interface UserAvatarListProps {
  users: User[]
  maxVisible?: number
  overlapAmount?: number
  actionButton?: ActionButton
}

export function UserAvatarList({ users, maxVisible = 3, overlapAmount = 8, actionButton }: UserAvatarListProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = users.length - maxVisible

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div
          className="flex -space-x-[var(--overlap-amount)] items-center"
          style={{ "--overlap-amount": `${overlapAmount}px` } as React.CSSProperties}
        >
          {visibleUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative rounded-full border border-background transition-transform hover:translate-y-[-3px] hover:z-10">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">{user.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <div className="relative z-10 flex h-7 w-7 border border-background items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
              +{remainingCount}
            </div>
          )}

          {actionButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={actionButton.disabled ? undefined : actionButton.onClick}
                  disabled={actionButton.disabled}
                  className="relative z-10 flex h-6 w-6 border border-background items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:translate-y-[-3px] hover:z-20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary"
                >
                  {actionButton.icon}
                </button>
              </TooltipTrigger>
              {actionButton.tooltip && (
                <TooltipContent side="bottom">
                  <p>{actionButton.tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
} 