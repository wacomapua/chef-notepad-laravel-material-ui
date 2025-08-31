import * as React from "react";
import Divider, { DividerProps } from "@mui/material/Divider";
import { cn } from "@/lib/utils";

function Separator({ className, ...props }: DividerProps) {
  return <Divider data-slot="separator" className={cn(className)} {...props} />;
}

export { Separator };
