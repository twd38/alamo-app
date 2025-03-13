import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingBadgeProps {
    /**
     * The current state of the save operation
     */
    status: "saved" | "saving" | "error";
    /**
     * Optional error message to display
     */
    errorMessage?: string;
    /**
     * Optional className to apply to the badge
     */
    className?: string;
}

export function SavingBadge({ 
    status, 
    errorMessage = "Error saving", 
    className 
}: SavingBadgeProps) {
    return (
        <Badge 
            variant={status === "error" ? "destructive" : "secondary"}
            className={cn(
                "h-6 transition-colors flex items-center gap-1",
                status === "error" 
                    ? "bg-red-100 text-red-700 hover:bg-red-100" 
                    : status === "saving"
                        ? "bg-muted" 
                        : "bg-muted/50",
                className
            )}
        >
            {status === "error" ? (
                <>
                    <AlertCircle className="h-3 w-3" />
                    {errorMessage}
                </>
            ) : status === "saving" ? (
                <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                </>
            ) : (
                <>
                    <Check className="h-3 w-3" />
                    Saved
                </>
            )}
        </Badge>
    );
} 