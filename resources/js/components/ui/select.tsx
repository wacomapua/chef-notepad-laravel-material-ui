import * as React from "react";
import SelectMUI, { SelectProps as MuiSelectProps } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import { cn } from "@/lib/utils";

function Select(props: MuiSelectProps) {
  return <SelectMUI data-slot="select" fullWidth size="small" {...props} />;
}

function SelectGroup(props: React.ComponentProps<"div">) {
  return <div data-slot="select-group" {...props} />;
}

function SelectValue(props: React.ComponentProps<"span">) {
  return <span data-slot="select-value" {...props} />;
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectMUI>) {
  return (
    <div data-slot="select-trigger" className={cn(className)}>
      {children}
    </div>
  );
}

function SelectContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="select-content" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof InputLabel>) {
  return <InputLabel data-slot="select-label" className={cn(className)} {...props} />;
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof MenuItem>) {
  return (
    <MenuItem data-slot="select-item" className={cn(className)} {...props}>
      {children}
    </MenuItem>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-separator" className={cn("h-px bg-border my-1", className)} {...props} />;
}

function SelectScrollUpButton(props: React.ComponentProps<"div">) {
  return <div data-slot="select-scroll-up-button" {...props} />;
}

function SelectScrollDownButton(props: React.ComponentProps<"div">) {
  return <div data-slot="select-scroll-down-button" {...props} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
