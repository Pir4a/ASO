"use client";

import { useEffect } from "react";

export function ProductsScrollToFirst({
  triggerKey,
  targetId,
}: {
  triggerKey: string;
  targetId: string;
}) {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    if (hash !== `#${targetId}`) return;

    const el = document.getElementById(targetId);
    if (!el) return;

    // Smoothly center the first product so the user immediately sees the match.
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [triggerKey, targetId]);

  return null;
}

