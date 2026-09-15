"use client";

import { useEffect } from "react";

if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    
    // Ignore bis_skin_checked mismatch (Avast, AVG, IDM, etc)
    if (
      msg.includes("bis_skin_checked") ||
      msg.includes("A tree hydrated but some attributes of the server rendered HTML didn't match") ||
      msg.includes("Hydration failed because the initial UI does not match")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export function HydrationFix() {
  return null;
}
