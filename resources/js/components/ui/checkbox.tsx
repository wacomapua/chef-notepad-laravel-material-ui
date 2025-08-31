import * as React from "react";
import MuiCheckbox, { CheckboxProps as MuiCheckboxProps } from "@mui/material/Checkbox";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: MuiCheckboxProps) {
  return <MuiCheckbox data-slot="checkbox" className={cn(className)} {...props} />;
}

export { Checkbox };
