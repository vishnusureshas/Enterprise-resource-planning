import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function LoadingSpinner({ fullPage = true, size = "default", className }: LoadingSpinnerProps) {
  const sizeMap = { sm: "h-4 w-4", default: "h-8 w-8", lg: "h-12 w-12" };

  if (fullPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size], className)} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size], className)} />
    </div>
  );
}
