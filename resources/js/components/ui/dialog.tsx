import * as React from "react";
import DialogMUI from "@mui/material/Dialog";
import DialogTitleMUI from "@mui/material/DialogTitle";
import DialogContentMUI from "@mui/material/DialogContent";
import DialogActionsMUI from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { cn } from "@/lib/utils";

type DialogProps = React.ComponentProps<typeof DialogMUI>;

function Dialog(props: DialogProps) {
  return <DialogMUI data-slot="dialog" {...props} />;
}

function DialogTrigger(props: React.ComponentProps<"button">) {
  return <button data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DialogClose(props: React.ComponentProps<typeof IconButton>) {
  return (
    <IconButton data-slot="dialog-close" aria-label="Close" {...props}>
      <CloseIcon />
    </IconButton>
  );
}

function DialogOverlay(props: React.ComponentProps<"div">) {
  return <div data-slot="dialog-overlay" className={cn("fixed inset-0 bg-black/50", props.className)} {...props} />;
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContentMUI>) {
  return (
    <DialogPortal>
      <DialogContentMUI data-slot="dialog-content" className={cn(className)} {...props}>
        {children}
      </DialogContentMUI>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<typeof DialogActionsMUI>) {
  return <DialogActionsMUI data-slot="dialog-footer" className={cn(className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitleMUI>) {
  return <DialogTitleMUI data-slot="dialog-title" className={cn(className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
