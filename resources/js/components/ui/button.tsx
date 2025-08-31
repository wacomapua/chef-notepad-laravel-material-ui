import * as React from "react";
import MuiButton, { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import { cn } from "@/lib/utils";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

type Props = Omit<MuiButtonProps, "variant" | "size"> & {
  variant?: Variant;
  size?: Size;
};

function Button({ className, variant = "default", size = "default", ...props }: Props) {
  const muiVariant: MuiButtonProps["variant"] =
    variant === "outline" || variant === "secondary" ? "outlined" : variant === "link" ? "text" : "contained";

  const sizeMap: Record<Size, MuiButtonProps["size"]> = {
    sm: "small",
    default: "medium",
    lg: "large",
    icon: "medium",
  };

  return (
    <MuiButton
      data-slot="button"
      variant={muiVariant}
      size={sizeMap[size]}
      className={cn(className)}
      {...props}
    />
  );
}

export { Button };
