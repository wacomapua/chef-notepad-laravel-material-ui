import * as React from "react";
import TooltipMUI, { TooltipProps } from "@mui/material/Tooltip";
import { cn } from "@/lib/utils";

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// This Tooltip component supports the Radix-style composition:
// <Tooltip>
//   <TooltipTrigger asChild>...</TooltipTrigger>
//   <TooltipContent>Text</TooltipContent>
// </Tooltip>
// It extracts trigger/content children and renders a MUI Tooltip accordingly.
function Tooltip({ children, ...rest }: Omit<TooltipProps, "title"> & { children: React.ReactNode }) {
  const nodes = React.Children.toArray(children) as React.ReactElement[];

  let trigger: React.ReactNode = null;
  let content: React.ReactNode = null;
  let triggerClassName: string | undefined;
  let contentClassName: string | undefined;

  nodes.forEach((el) => {
    if (!React.isValidElement(el)) return;
    const slot = (el.props as any)?.["data-slot"];
    if (slot === "tooltip-trigger") {
      trigger = (el.props as any).children;
      triggerClassName = (el.props as any).className;
    } else if (slot === "tooltip-content") {
      content = (el.props as any).children;
      contentClassName = (el.props as any).className;
    }
  });

  // Fallback: if no trigger wrapper, use direct children
  if (!trigger) trigger = children;

  return (
    <TooltipMUI title={<span className={cn(contentClassName)}>{content}</span>} {...(rest as TooltipProps)}>
      <span className={cn(triggerClassName)}>{trigger}</span>
    </TooltipMUI>
  );
}

// Marker components: do not render DOM nodes to avoid leaking unknown props like `asChild`.
function TooltipTrigger({ children }: { children?: React.ReactNode; asChild?: boolean; className?: string }) {
  // Render nothing; parent Tooltip will extract this node and render the actual trigger element
  return <span data-slot="tooltip-trigger" style={{ display: "none" }}>{children as any}</span> as any;
}

function TooltipContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <span data-slot="tooltip-content" className={cn(className)} style={{ display: "none" }}>
      {children}
    </span>
  ) as any;
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
