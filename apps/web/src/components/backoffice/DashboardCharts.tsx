"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { API_URL } from "@/lib/api";

export type AdminDashboardData = {
  kpi: {
    revenueToday: number;
    ordersToday: number;
    revenueYesterday: number;
    ordersYesterday: number;
  };
  salesByDay: { date: string; revenue: number; orders: number }[];
  weeklyRevenue: { weekStart: string; revenue: number; orders: number }[];
  statusMix7d: { status: string; count: number; revenue: number }[];
  categoryShare30d: { categoryName: string; revenue: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "color-mix(in srgb, var(--foreground) 40%, transparent)",
  processing: "var(--primary)",
  shipped: "color-mix(in srgb, var(--foreground) 70%, transparent)",
  delivered: "var(--success)",
  cancelled: "var(--error)",
};

const CATEGORY_PALETTE = [
  "var(--primary)",
  "var(--foreground)",
  "color-mix(in srgb, var(--primary) 60%, transparent)",
  "color-mix(in srgb, var(--foreground) 60%, transparent)",
];

function statusLabelFr(s: string) {
  const m: Record<string, string> = {
    pending: "En attente",
    processing: "En traitement",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  };
  return m[s] ?? s;
}

export function DashboardCharts({ data }: { data: AdminDashboardData }) {
  const totalStatus = data.statusMix7d.reduce((a, b) => a + b.count, 0) || 1;
  let angle = 0;
  const pieStops = data.statusMix7d.map((row) => {
    const slice = (row.count / totalStatus) * 360;
    const start = angle;
    angle += slice;
    const color = STATUS_COLORS[row.status] ?? "color-mix(in srgb, var(--foreground) 20%, transparent)";
    return `${color} ${start.toFixed(2)}deg ${angle.toFixed(2)}deg`;
  });

  const maxDay = Math.max(1, ...data.salesByDay.map((d) => d.revenue));
  const maxWeek = Math.max(1, ...data.weeklyRevenue.map((d) => d.revenue));
  const catTotal = data.categoryShare30d.reduce((a, b) => a + b.revenue, 0) || 1;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Statuts (7 jours)</p>
          <p className="mt-1 text-[11px] text-foreground/50">Répartition des commandes par statut</p>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <div
            className="h-36 w-36 shrink-0 rounded-full border border-foreground/10 shadow-inner"
            style={{
              background: pieStops.length
                ? `conic-gradient(${pieStops.join(", ")})`
                : "conic-gradient(color-mix(in srgb, var(--foreground) 10%, transparent) 0deg 360deg)",
            }}
            role="img"
            aria-label="Répartition des statuts sur 7 jours"
          />
          <ul className="min-w-0 flex-1 space-y-2 text-xs">
            {data.statusMix7d.length === 0 ? (
              <li className="text-foreground/50">Aucune commande sur la période.</li>
            ) : (
              data.statusMix7d.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium text-foreground/80">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[row.status] ?? "color-mix(in srgb, var(--foreground) 40%, transparent)" }}
                    />
                    {statusLabelFr(row.status)}
                  </span>
                  <span className="shrink-0 font-mono text-foreground/60">
                    {row.count} · {row.revenue.toFixed(0)} €
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">CA par catégorie (30 j.)</p>
          <p className="mt-1 text-[11px] text-foreground/50">Barres empilées proportionnelles au CA</p>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-background">
          <div className="flex h-full w-full">
            {data.categoryShare30d.map((c, i) => {
              const w = (c.revenue / catTotal) * 100;
              const color = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
              return (
                <div
                  key={c.categoryName}
                  title={`${c.categoryName}: ${c.revenue.toFixed(2)} €`}
                  className="h-full min-w-0 transition hover:opacity-90"
                  style={{ width: `${w}%`, background: color }}
                />
              );
            })}
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/70">
          {data.categoryShare30d.map((c, i) => {
            const color = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
            return (
              <li key={c.categoryName} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {c.categoryName}{" "}
                <span className="font-mono text-foreground/50">({c.revenue.toFixed(0)} €)</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">CA / jour (7 derniers jours)</p>
        <div className="flex h-40 items-end gap-1 sm:gap-2">
          {data.salesByDay.map((d) => (
            <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full max-w-[3rem] flex-col justify-end rounded-md bg-background sm:max-w-none">
                <div
                  className="w-full rounded-t-md bg-linear-to-t from-primary to-primary-hover"
                  style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }}
                  title={`${d.date}: ${d.revenue.toFixed(2)} € · ${d.orders} cmd`}
                />
              </div>
              <span className="text-[9px] font-medium text-foreground/60 sm:text-[10px]">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">CA par semaine (5 semaines)</p>
        <div className="flex h-36 items-end gap-2">
          {data.weeklyRevenue.map((w) => (
            <div key={w.weekStart} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full flex-col justify-end rounded-md bg-background">
                <div
                  className="w-full rounded-t-md bg-linear-to-t from-primary to-primary"
                  style={{ height: `${Math.max(4, (w.revenue / maxWeek) * 100)}%` }}
                  title={`Semaine du ${w.weekStart}: ${w.revenue.toFixed(2)} €`}
                />
              </div>
              <span className="truncate text-[9px] text-foreground/60 sm:text-[10px]" title={w.weekStart}>
                {w.weekStart.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SalesByCategoryPie />
      <AvgCartByCategoryBars />
    </div>
  );
}

type Period = "7d" | "5w";

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const Btn = ({ p, label }: { p: Period; label: string }) => (
    <button
      type="button"
      onClick={() => onChange(p)}
      className={
        value === p
          ? "rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white"
          : "rounded-md border border-foreground/10 bg-white px-2.5 py-1 text-[11px] font-medium text-foreground/70 transition hover:border-primary hover:text-primary"
      }
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-1.5">
      <Btn p="7d" label="7 j" />
      <Btn p="5w" label="5 sem" />
    </div>
  );
}

/** #16 — pie chart: revenue by category over the selected window. */
function SalesByCategoryPie() {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<
    | { period: Period; total: number; data: { categoryId: string; name: string; revenue: number; percentage: number }[] }
    | null
  >(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/admin/dashboard/sales-by-category?period=${period}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const slices = data?.data ?? [];
  const total = data?.total ?? 0;
  let angle = 0;
  const stops = slices.map((s, i) => {
    const sliceDeg = total > 0 ? (s.revenue / total) * 360 : 0;
    const start = angle;
    angle += sliceDeg;
    const color = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
    return `${color} ${start.toFixed(2)}deg ${angle.toFixed(2)}deg`;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            CA par catégorie
          </p>
          <p className="mt-1 text-[11px] text-foreground/50">
            {period === "7d" ? "7 derniers jours" : "5 dernières semaines"} · {total.toFixed(0)} € au total
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      {loading ? (
        <p className="text-xs text-foreground/50">Chargement…</p>
      ) : slices.length === 0 ? (
        <p className="text-xs text-foreground/50">Aucune vente sur la période.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-8">
          <div
            className="h-36 w-36 shrink-0 rounded-full border border-foreground/10 shadow-inner"
            style={{
              background: stops.length
                ? `conic-gradient(${stops.join(", ")})`
                : "conic-gradient(color-mix(in srgb, var(--foreground) 10%, transparent) 0deg 360deg)",
            }}
            role="img"
            aria-label="CA par catégorie"
          />
          <ul className="min-w-0 flex-1 space-y-2 text-xs">
            {slices.map((s, i) => (
              <li
                key={s.categoryId}
                className="flex items-center justify-between gap-2"
                title={`${s.revenue.toFixed(2)} €`}
              >
                <span className="flex items-center gap-2 font-medium text-foreground/80">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
                  />
                  {s.name}
                </span>
                <span className="shrink-0 font-mono text-foreground/60">
                  {s.percentage.toFixed(1)} % · {s.revenue.toFixed(0)} €
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** #15 — multi-layer (stacked) bars: avg cart per category, per day or per week. */
function AvgCartByCategoryBars() {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<
    | { period: Period; buckets: { date: string; byCategory: Record<string, number> }[]; categories: { id: string; name: string }[] }
    | null
  >(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/admin/dashboard/avg-cart?period=${period}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const buckets = data?.buckets ?? [];
  const categories = data?.categories ?? [];
  const max =
    Math.max(
      1,
      ...buckets.map((b) =>
        Object.values(b.byCategory).reduce((sum, v) => sum + Number(v || 0), 0),
      ),
    ) || 1;

  return (
    <div className="space-y-4 lg:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Panier moyen par catégorie
          </p>
          <p className="mt-1 text-[11px] text-foreground/50">
            {period === "7d" ? "7 derniers jours" : "5 dernières semaines"} · barres empilées
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      {loading ? (
        <p className="text-xs text-foreground/50">Chargement…</p>
      ) : categories.length === 0 ? (
        <p className="text-xs text-foreground/50">Aucune commande sur la période.</p>
      ) : (
        <>
          <div className="flex h-44 items-end gap-1.5 sm:gap-2.5">
            {buckets.map((b) => {
              const total = Object.values(b.byCategory).reduce((sum, v) => sum + Number(v || 0), 0);
              return (
                <div key={b.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="flex h-36 w-full max-w-[3.5rem] flex-col-reverse overflow-hidden rounded-md bg-background sm:max-w-none"
                    title={`${b.date}: ${total.toFixed(2)} €`}
                  >
                    {categories.map((c, i) => {
                      const v = Number(b.byCategory[c.id] || 0);
                      if (v <= 0) return null;
                      const h = (v / max) * 100;
                      return (
                        <div
                          key={c.id}
                          style={{
                            height: `${h}%`,
                            background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
                          }}
                          title={`${c.name}: ${v.toFixed(2)} € (panier moyen)`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[9px] font-medium text-foreground/60 sm:text-[10px]">
                    {b.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/70">
            {categories.map((c, i) => (
              <li key={c.id} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
                />
                {c.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
