"use client";

import { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Icons (inline, no extra deps)                                              */
/* -------------------------------------------------------------------------- */

type IconProps = { className?: string };

export const Icon = {
  Overview: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  Products: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2.5 4.5 8 2l5.5 2.5L8 7 2.5 4.5Z" />
      <path d="M2.5 4.5v7L8 14l5.5-2.5v-7" />
      <path d="M8 7v7" />
    </svg>
  ),
  Categories: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z" />
    </svg>
  ),
  Users: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <circle cx="6" cy="6" r="2.5" />
      <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <circle cx="11.5" cy="6.5" r="1.8" />
      <path d="M10.5 13c0-1.6 1.4-3.5 3.5-3.5" />
    </svg>
  ),
  Orders: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2 3h2l1.5 8h7L14 5H5" />
      <circle cx="6" cy="14" r="1" />
      <circle cx="12" cy="14" r="1" />
    </svg>
  ),
  Messages: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <rect x="2" y="3.5" width="12" height="9" rx="1" />
      <path d="m2.5 4.5 5.5 4 5.5-4" />
    </svg>
  ),
  Doc: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M4 2h5l3 3v9H4V2Z" />
      <path d="M9 2v3h3" />
    </svg>
  ),
  Settings: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
    </svg>
  ),
  Bell: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M3.5 11.5V7a4.5 4.5 0 1 1 9 0v4.5M2.5 11.5h11M6.5 13.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  ),
  Search: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  ),
  Refresh: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M13.5 3v3h-3M2.5 13v-3h3" />
      <path d="M13 6a5.5 5.5 0 0 0-9.8-1.2M3 10a5.5 5.5 0 0 0 9.8 1.2" />
    </svg>
  ),
  Download: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M8 2v8m0 0 3-3m-3 3-3-3M3 13h10" />
    </svg>
  ),
  Plus: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  ChevD: ({ className = "h-3 w-3" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="m4 6 4 4 4-4" />
    </svg>
  ),
  ChevR: ({ className = "h-3 w-3" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="m6 4 4 4-4 4" />
    </svg>
  ),
  ArrowUp: ({ className = "h-3 w-3" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <path d="M8 13V3m0 0-3 3m3-3 3 3" />
    </svg>
  ),
  ArrowDown: ({ className = "h-3 w-3" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <path d="M8 3v10m0 0 3-3m-3 3-3-3" />
    </svg>
  ),
  More: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <circle cx="3.5" cy="8" r="1" />
      <circle cx="8" cy="8" r="1" />
      <circle cx="12.5" cy="8" r="1" />
    </svg>
  ),
  X: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  ),
  Logout: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M6 2H3v12h3M10 5l3 3-3 3M6 8h7" />
    </svg>
  ),
  Warn: ({ className = "h-3 w-3" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M8 2.5 14 13H2L8 2.5Z" />
      <path d="M8 7v3M8 11.5v.5" />
    </svg>
  ),
  Check: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m3 8 3.5 3.5L13 5" />
    </svg>
  ),
  Trash: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-5 0v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
    </svg>
  ),
  Edit: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M3 13h3L13 6l-3-3L3 10v3z" />
    </svg>
  ),
  Shield: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M8 1.5 3 3v4c0 3.3 2.3 6.2 5 7 2.7-.8 5-3.7 5-7V3z" />
    </svg>
  ),
  Key: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <circle cx="6" cy="10" r="2.5" />
      <path d="m13.5 2.5-6 6M10 5l3 3" />
    </svg>
  ),
  TrendUp: ({ className = "h-3 w-3" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <path d="M2 11 6 7l3 3 5-5M9 4h5v5" />
    </svg>
  ),
  Flag: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M4 14V3h7l-1.5 2.5L11 8H4" />
    </svg>
  ),
  Home: ({ className = "h-3.5 w-3.5" }: IconProps) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M2.5 7.5 8 3l5.5 4.5V13a1 1 0 0 1-1 1H10v-4H6v4H3.5a1 1 0 0 1-1-1V7.5Z" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/*  Panel (used by ContentManager + back-office sections)                      */
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
    <section className={`bo-card ${className}`}>
      {(title || actions) && (
        <header className="bo-card-head">
          <div>
            {title && <div className="bo-card-title">{title}</div>}
            {subtitle && <div className="bo-card-sub">{subtitle}</div>}
          </div>
          {actions && <div className="bo-card-actions">{actions}</div>}
        </header>
      )}
      <div className="bo-card-body">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge                                                                      */
/* -------------------------------------------------------------------------- */

type BadgeTone = "slate" | "emerald" | "amber" | "rose" | "sky" | "violet";

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const cls: Record<BadgeTone, string> = {
    slate: "neutral",
    emerald: "ok",
    amber: "warn",
    rose: "danger",
    sky: "brand",
    violet: "brand",
  };
  return <span className={`bo-badge ${cls[tone]}`}>{children}</span>;
}

/* -------------------------------------------------------------------------- */
/*  IconButton (used by back office tables)                                    */
/* -------------------------------------------------------------------------- */

type IconBtnTone = "slate" | "rose" | "emerald" | "primary";

export function IconButton({
  children,
  onClick,
  title,
  tone = "slate",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  tone?: IconBtnTone;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const map: Record<IconBtnTone, string> = {
    slate: "",
    rose: "danger",
    emerald: "",
    primary: "",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`bo-btn ${map[tone]}`}
      style={
        tone === "emerald"
          ? { color: "var(--bo-ok)", borderColor: "var(--bo-ok-soft)" }
          : tone === "primary"
          ? { color: "var(--bo-brand)", borderColor: "var(--bo-brand-soft)" }
          : undefined
      }
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  KPI card with sparkline                                                    */
/* -------------------------------------------------------------------------- */

export type DeltaDir = "up" | "down" | "flat";

export function DeltaChip({ dir, txt }: { dir: DeltaDir; txt: string }) {
  return (
    <span className={`bo-delta ${dir}`}>
      {dir === "up" && <Icon.ArrowUp className="h-2.5 w-2.5" />}
      {dir === "down" && <Icon.ArrowDown className="h-2.5 w-2.5" />}
      {txt}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  hint,
  hintRight,
  delta,
  spark,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  hintRight?: string;
  delta?: { dir: DeltaDir; txt: string };
  spark?: number[];
}) {
  return (
    <div className="bo-kpi">
      <div className="bo-kpi-head">
        <div className="bo-kpi-label">{label}</div>
        {delta && <DeltaChip dir={delta.dir} txt={delta.txt} />}
      </div>
      <div className="bo-kpi-value bo-num">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {(hint || hintRight) && (
        <div className="bo-kpi-foot">
          <span>{hint}</span>
          {hintRight && <span className="bo-dim">{hintRight}</span>}
        </div>
      )}
      {spark && spark.length > 1 && <Sparkline data={spark} color="var(--bo-brand)" />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Charts                                                                     */
/* -------------------------------------------------------------------------- */

export function Sparkline({
  data,
  color,
  height = 22,
  fill = true,
}: {
  data: number[];
  color: string;
  height?: number;
  fill?: boolean;
}) {
  const w = 100;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const step = w / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [i * step, h - 2 - ((v - min) / range) * (h - 4)] as const);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg className="bo-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={d} stroke={color} strokeWidth="1.3" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function BarChart({
  data,
  labels,
  color,
  height = 200,
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const w = 400;
  const h = height;
  const pad = { l: 28, r: 12, t: 10, b: 22 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const max = Math.max(...data, 1);
  const bw = cw / Math.max(1, data.length);
  const ticks = [0, Math.ceil(max / 2), Math.ceil(max)];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
      {ticks.map((t, i) => {
        const y = pad.t + ch - (t / max) * ch;
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y}
              y2={y}
              stroke="var(--bo-border)"
              strokeDasharray={i === 0 ? "0" : "2 3"}
            />
            <text
              x={pad.l - 6}
              y={y + 3}
              fontSize="9"
              fill="var(--bo-text-dim)"
              textAnchor="end"
              fontFamily="JetBrains Mono"
            >
              {t}
            </text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const bh = (v / max) * ch;
        const x = pad.l + i * bw + 4;
        const y = pad.t + ch - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={Math.max(1, bw - 8)} height={Math.max(1, bh)} rx="2" fill={color} opacity="0.9" />
            <text
              x={x + (bw - 8) / 2}
              y={h - pad.b + 12}
              fontSize="9.5"
              fill="var(--bo-text-dim)"
              textAnchor="middle"
              fontFamily="Inter"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  segments,
  size = 160,
  centerLabel = "TOTAL",
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const startAngles: number[] = [];
  segments.reduce((acc, seg) => {
    startAngles.push(acc);
    return acc + (seg.value / total) * Math.PI * 2;
  }, -Math.PI / 2);
  const arcs = segments.map((seg, i) => {
    const start = startAngles[i];
    const ang = (seg.value / total) * Math.PI * 2;
    const end = start + ang;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = ang > Math.PI ? 1 : 0;
    const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    return <path key={i} d={d} fill={seg.color} stroke="var(--bo-panel)" strokeWidth="2" />;
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {arcs}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--bo-panel)" />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize="20"
        fontWeight="600"
        fill="var(--bo-text)"
        fontFamily="Inter"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="9.5"
        fill="var(--bo-text-muted)"
        fontFamily="Inter"
        letterSpacing="0.06em"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Legacy alias — kept so older call sites compile, now mapped to KpiCard     */
/* -------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  trend,
  hint,
}: {
  label: string;
  value: ReactNode;
  trend?: string;
  hint?: string;
  tone?: string;
  icon?: ReactNode;
}) {
  return (
    <KpiCard
      label={label}
      value={value}
      hint={hint}
      delta={trend ? { dir: "up", txt: trend } : undefined}
    />
  );
}
