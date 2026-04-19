"use client";

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
  pending: "#94a3b8",
  processing: "#38bdf8",
  shipped: "#a78bfa",
  delivered: "#34d399",
  cancelled: "#fb7185",
};

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
    const color = STATUS_COLORS[row.status] ?? "#cbd5e1";
    return `${color} ${start.toFixed(2)}deg ${angle.toFixed(2)}deg`;
  });

  const maxDay = Math.max(1, ...data.salesByDay.map((d) => d.revenue));
  const maxWeek = Math.max(1, ...data.weeklyRevenue.map((d) => d.revenue));
  const catTotal = data.categoryShare30d.reduce((a, b) => a + b.revenue, 0) || 1;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statuts (7 jours)</p>
          <p className="mt-1 text-[11px] text-slate-400">Répartition des commandes par statut</p>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <div
            className="h-36 w-36 shrink-0 rounded-full border border-slate-200 shadow-inner"
            style={{
              background: pieStops.length
                ? `conic-gradient(${pieStops.join(", ")})`
                : "conic-gradient(#e2e8f0 0deg 360deg)",
            }}
            role="img"
            aria-label="Répartition des statuts sur 7 jours"
          />
          <ul className="min-w-0 flex-1 space-y-2 text-xs">
            {data.statusMix7d.length === 0 ? (
              <li className="text-slate-400">Aucune commande sur la période.</li>
            ) : (
              data.statusMix7d.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[row.status] ?? "#94a3b8" }}
                    />
                    {statusLabelFr(row.status)}
                  </span>
                  <span className="shrink-0 font-mono text-slate-500">
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CA par catégorie (30 j.)</p>
          <p className="mt-1 text-[11px] text-slate-400">Barres empilées proportionnelles au CA</p>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full w-full">
            {data.categoryShare30d.map((c, i) => {
              const w = (c.revenue / catTotal) * 100;
              const hue = 160 + (i * 37) % 120;
              return (
                <div
                  key={c.categoryName}
                  title={`${c.categoryName}: ${c.revenue.toFixed(2)} €`}
                  className="h-full min-w-0 transition hover:opacity-90"
                  style={{ width: `${w}%`, background: `hsl(${hue} 45% 45%)` }}
                />
              );
            })}
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
          {data.categoryShare30d.map((c, i) => {
            const hue = 160 + (i * 37) % 120;
            return (
              <li key={c.categoryName} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${hue} 45% 45%)` }} />
                {c.categoryName}{" "}
                <span className="font-mono text-slate-400">({c.revenue.toFixed(0)} €)</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CA / jour (7 derniers jours)</p>
        <div className="flex h-40 items-end gap-1 sm:gap-2">
          {data.salesByDay.map((d) => (
            <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full max-w-[3rem] flex-col justify-end rounded-md bg-slate-100 sm:max-w-none">
                <div
                  className="w-full rounded-t-md bg-linear-to-t from-[#00a8b5] to-[#33bfc9]"
                  style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }}
                  title={`${d.date}: ${d.revenue.toFixed(2)} € · ${d.orders} cmd`}
                />
              </div>
              <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CA par semaine (5 semaines)</p>
        <div className="flex h-36 items-end gap-2">
          {data.weeklyRevenue.map((w) => (
            <div key={w.weekStart} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full flex-col justify-end rounded-md bg-slate-100">
                <div
                  className="w-full rounded-t-md bg-linear-to-t from-violet-600 to-fuchsia-500"
                  style={{ height: `${Math.max(4, (w.revenue / maxWeek) * 100)}%` }}
                  title={`Semaine du ${w.weekStart}: ${w.revenue.toFixed(2)} €`}
                />
              </div>
              <span className="truncate text-[9px] text-slate-500 sm:text-[10px]" title={w.weekStart}>
                {w.weekStart.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
