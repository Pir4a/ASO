"use client";

import { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Icons (inline, no extra deps)                                              */
/* -------------------------------------------------------------------------- */

type IconProps = { className?: string };

export const Icon = {
  Overview: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Products: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
    </svg>
  ),
  Categories: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Users: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.7" />
    </svg>
  ),
  Orders: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  Messages: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 6.5 12 13 3 6.5" />
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  ),
  TrendUp: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 17 9 11l4 4 8-8M14 7h7v7" />
    </svg>
  ),
  Search: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Plus: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Refresh: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 12a8 8 0 1 1-3-6.3L20 8M20 3v5h-5" />
    </svg>
  ),
  ArrowUp: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  ),
  Trash: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" />
    </svg>
  ),
  Edit: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
    </svg>
  ),
  Shield: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2 4 5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11V5z" />
    </svg>
  ),
  Key: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="15" r="4" />
      <path d="m21 2-9.6 9.6M15 6l5 5" />
    </svg>
  ),
  Check: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
  X: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Bell: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5M9 17a3 3 0 0 0 6 0" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

type Tone = "primary" | "emerald" | "amber" | "violet" | "rose" | "sky";

const toneMap: Record<Tone, { bg: string; ring: string; text: string; iconBg: string; iconText: string }> = {
  primary: { bg: "from-primary to-primary-hover", ring: "ring-primary/20", text: "text-white", iconBg: "bg-white/20", iconText: "text-white" },
  emerald: { bg: "from-success to-success/30", ring: "ring-success/20", text: "text-white", iconBg: "bg-white/20", iconText: "text-white" },
  amber: { bg: "from-warning to-warning/30", ring: "ring-warning/20", text: "text-white", iconBg: "bg-white/20", iconText: "text-white" },
  violet: { bg: "from-primary to-primary", ring: "ring-primary/20", text: "text-white", iconBg: "bg-white/20", iconText: "text-white" },
  rose: { bg: "from-error to-primary", ring: "ring-error/20", text: "text-white", iconBg: "bg-white/20", iconText: "text-white" },
  sky: { bg: "from-primary to-primary", ring: "ring-primary/20", text: "text-white", iconBg: "bg-white/20", iconText: "text-white" },
};

export function StatCard({
  label,
  value,
  trend,
  hint,
  tone = "primary",
  icon,
}: {
  label: string;
  value: ReactNode;
  trend?: string;
  hint?: string;
  tone?: Tone;
  icon: ReactNode;
}) {
  const s = toneMap[tone];
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${s.bg} p-5 shadow-lg ring-1 ${s.ring}`}>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${s.text}/80 opacity-80`}>{label}</p>
          <p className={`mt-2 text-3xl font-bold ${s.text}`}>{value}</p>
          {trend && (
            <p className={`mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold ${s.text}`}>
              <Icon.TrendUp className="h-3 w-3" />
              {trend}
            </p>
          )}
          {hint && <p className={`mt-2 text-xs ${s.text} opacity-75`}>{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} ${s.iconText}`}>
          {icon}
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel (dashboard section)                                                  */
/* -------------------------------------------------------------------------- */

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-white shadow-[0_4px_6px_-1px_rgb(0,0,0,0.08),0_2px_4px_-2px_rgb(0,0,0,0.05)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 px-6 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-foreground/60">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge                                                                      */
/* -------------------------------------------------------------------------- */

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky" | "violet";
}) {
  const map = {
    slate: "bg-background text-foreground/80 ring-foreground/10",
    emerald: "bg-success/10 text-success ring-success/30",
    amber: "bg-warning/10 text-warning ring-warning/30",
    rose: "bg-error/10 text-error ring-error/30",
    sky: "bg-primary/10 text-primary ring-primary/30",
    violet: "bg-primary/10 text-primary ring-primary/30",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${map[tone]}`}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export function IconButton({
  children,
  onClick,
  title,
  tone = "slate",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  tone?: "slate" | "rose" | "emerald" | "primary";
  type?: "button" | "submit";
}) {
  const map = {
    slate: "border-foreground/10 text-foreground/70 hover:border-foreground/20 hover:bg-background",
    rose: "border-error/30 text-error hover:border-error/30 hover:bg-error/10",
    emerald: "border-success/30 text-success hover:border-success/30 hover:bg-success/10",
    primary: "border-primary/30 text-primary hover:border-primary hover:bg-primary/5",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium transition-colors ${map[tone]}`}
    >
      {children}
    </button>
  );
}
