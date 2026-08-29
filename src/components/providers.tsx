"use client";

import React, { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://colorful-guanaco-817.eu-west-1.convex.cloud";

  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProvider client={convex}>
      <TooltipProvider delayDuration={150}>
        {children}
      </TooltipProvider>
    </ConvexProvider>
  );
}
