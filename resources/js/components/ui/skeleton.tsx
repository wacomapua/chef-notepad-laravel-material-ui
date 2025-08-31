import * as React from "react";
import SkeletonMUI, { SkeletonProps } from "@mui/material/Skeleton";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: SkeletonProps) {
  return <SkeletonMUI data-slot="skeleton" className={cn(className)} {...props} />;
}

export { Skeleton };
