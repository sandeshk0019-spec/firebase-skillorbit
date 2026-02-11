"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation, decorative, ...props },
    ref
  ) => {
    const orientationProp = orientation ?? "horizontal";
    const decorativeProp = decorative ?? true;
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorativeProp}
        orientation={orientationProp}
        className={cn(
          "shrink-0 bg-border",
          orientationProp === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
      />
    );
  }
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
