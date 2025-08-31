import * as React from "react";
import MUICard from "@mui/material/Card";
import CardContentMUI from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<typeof MUICard>) {
  return <MUICard data-slot="card" className={cn(className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("font-semibold", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<typeof CardContentMUI>) {
  return <CardContentMUI data-slot="card-content" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof CardActions>) {
  return <CardActions data-slot="card-footer" className={cn(className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
