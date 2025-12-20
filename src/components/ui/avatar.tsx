import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ className, src, alt, fallback = "U", ...props }: AvatarProps) {
  return (
    <div 
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted",
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium uppercase text-muted-foreground">
          {fallback}
        </div>
      )}
    </div>
  );
}
