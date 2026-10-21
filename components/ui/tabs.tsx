"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";

type TabsRootProps = ComponentProps<typeof TabsPrimitive.Root> & { className?: string };

export function TabsRoot({ className = "", ...props }: TabsRootProps) {
  return <div className={className}><TabsPrimitive.Root {...props} /></div>;
}

export function TabsList({ className = "", ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={`category-tabs ${className}`} {...props} />;
}

export function TabsTrigger({ className = "", ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={`category-tab ${className}`} {...props} />;
}

export function TabsContent({ className = "", ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={`category-tab-panel ${className}`} {...props} />;
}
