import * as React from "react";
import Chip, { ChipProps } from "@mui/material/Chip";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline";

function Badge({ className, children, variant = "default", color, ...props }: Partial<ChipProps> & { variant?: Variant; children?: React.ReactNode }) {
  const derivedColor: ChipProps["color"] = color ?? (variant === "destructive" ? "error" : variant === "secondary" ? "secondary" : "primary");
  const outlined = variant === "outline";
  return (
    <Chip
      data-slot="badge"
      color={derivedColor}
      variant={outlined ? "outlined" : "filled"}
      className={cn(className)}
      label={children}
      {...props}
    />
  );
}

export { Badge };
