import React from "react";
import { cn } from "@/lib/utils";

const Spinner = ({ className, size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-current border-t-transparent text-primary",
        sizeClasses[size],
        className
      )}
    />
  );
};

export { Spinner };