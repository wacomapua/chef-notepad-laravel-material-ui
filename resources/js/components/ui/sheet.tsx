import * as React from "react";
import Drawer, { DrawerProps } from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { cn } from "@/lib/utils";

function Sheet(props: React.ComponentProps<"div">) {
  return <div data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<"button">) {
  return <button data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof IconButton>) {
  return (
    <IconButton data-slot="sheet-close" aria-label="Close" {...props}>
      <CloseIcon />
    </IconButton>
  );
}

function SheetPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-overlay" className={cn("fixed inset-0 bg-black/50", className)} {...props} />;
}

function SheetContent({
  className,
  side = "right",
  children,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<"div"> & { side?: "top" | "right" | "bottom" | "left"; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const anchor = side;
  return (
    <SheetPortal>
      <Drawer
        data-slot="sheet-content"
        anchor={anchor}
        open={!!open}
        onClose={() => onOpenChange?.(false)}
        PaperProps={{ className: cn("p-6", className) }}
        {...(props as any)}
      >
        {children}
      </Drawer>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="sheet-title" className={cn("text-foreground font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="sheet-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
