import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    /** If true, content becomes visible when focused (for skip links) */
    focusable?: boolean;
}

/**
 * VisuallyHidden component hides content visually while keeping it accessible to screen readers.
 * Use for ARIA labels, skip links, and other accessibility content.
 */
export function VisuallyHidden({
    children,
    focusable = false,
    className,
    ...props
}: VisuallyHiddenProps) {
    return (
        <span
            className={cn(
                "sr-only",
                focusable && "focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:p-4 focus:rounded-md",
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

/**
 * Announce content to screen readers using aria-live
 */
export function LiveRegion({
    children,
    politeness = "polite"
}: {
    children: React.ReactNode;
    politeness?: "polite" | "assertive";
}) {
    return (
        <div
            role="status"
            aria-live={politeness}
            aria-atomic="true"
            className="sr-only"
        >
            {children}
        </div>
    );
}
