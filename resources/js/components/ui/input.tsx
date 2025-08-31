import * as React from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <TextField
      data-slot="input"
      type={type}
      size="small"
      variant="outlined"
      fullWidth
      className={cn(className)}
      inputProps={{ className: "bg-transparent" }}
      {...(props as unknown as TextFieldProps)}
    />
  );
}

export { Input };
