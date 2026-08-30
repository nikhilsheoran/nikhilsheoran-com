"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

let convex: ConvexReactClient | null = null;

function getConvexClient() {
  if (!convex) {
    convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={getConvexClient()} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
