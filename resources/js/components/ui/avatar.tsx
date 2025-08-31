import * as React from "react";
import MuiAvatar, { AvatarProps as MuiAvatarProps } from "@mui/material/Avatar";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: MuiAvatarProps) {
  return <MuiAvatar data-slot="avatar" className={cn(className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img data-slot="avatar-image" className={cn(className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="avatar-fallback" className={cn(className)} {...props} />;
}

export { Avatar, AvatarImage, AvatarFallback };
