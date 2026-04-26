"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FLOURISH_EVENT = "aso:bo-transition";

interface BoTransitionDetail {
  to: string;
}

export function triggerBoTransition(to: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<BoTransitionDetail>(FLOURISH_EVENT, { detail: { to } }),
  );
}

type Phase = "idle" | "in" | "out";

/**
 * Full-screen ECG flourish played when navigating between the storefront
 * and the BO. An SVG heart-rate trace sweeps across the screen while the
 * Althea mark pulses at midpoint; the underlying route swap happens behind
 * the overlay so the user lands on the destination as the line completes.
 */
export function RouteFlourish() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };

    const onTrigger = (event: Event) => {
      const detail = (event as CustomEvent<BoTransitionDetail>).detail;
      if (!detail?.to) return;
      clearTimers();
      setPhase("in");
      timersRef.current.push(
        window.setTimeout(() => router.push(detail.to), 520),
        window.setTimeout(() => setPhase("out"), 880),
        window.setTimeout(() => setPhase("idle"), 1180),
      );
    };

    window.addEventListener(FLOURISH_EVENT, onTrigger);
    return () => {
      window.removeEventListener(FLOURISH_EVENT, onTrigger);
      clearTimers();
    };
  }, [router]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className={`route-flourish route-flourish--${phase}`}
    >
      <div className="route-flourish__backdrop" />
      <div className="route-flourish__stage">
        <svg
          viewBox="-200 -60 400 120"
          preserveAspectRatio="xMidYMid meet"
          className="route-flourish__ecg"
        >
          {/* faint baseline so the trace doesn't look like it floats in space */}
          <line
            x1="-200"
            y1="0"
            x2="200"
            y2="0"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          <path
            pathLength={100}
            d="M -200 0 H -55 l 5 -4 l 4 6 l 4 -3 H -28 l 3 -38 l 4 60 l 3 -28 l 3 8 H 30 l 6 -10 l 6 12 l 5 -4 H 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="route-flourish__path"
          />
        </svg>
        <div className="route-flourish__logo">
          <Image
            src="/logo-mark.png"
            alt=""
            width={82}
            height={71}
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
