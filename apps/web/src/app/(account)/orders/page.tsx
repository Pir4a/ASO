"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrders, type OrderDTO, type OrdersByYear, type OrderStatus } from "@/lib/api";

type StatusFilter = "all" | "active" | "completed" | "cancelled";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  processing: "En traitement",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function statusTone(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-success/10 text-success";
    case "cancelled":
      return "bg-error/10 text-error";
    case "pending":
    case "processing":
    case "shipped":
    default:
      return "bg-primary/10 text-primary";
  }
}

function statusGroup(status: OrderStatus): StatusFilter {
  if (status === "delivered") return "completed";
  if (status === "cancelled") return "cancelled";
  return "active";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function uniqueProductTypes(ordersByYear: OrdersByYear): string[] {
  const set = new Set<string>();
  for (const orders of Object.values(ordersByYear)) {
    for (const order of orders) {
      for (const item of order.items ?? []) {
        if (item.productName) set.add(item.productName);
      }
    }
  }
  return Array.from(set).sort();
}

export default function OrdersPage() {
  const [data, setData] = useState<OrdersByYear>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [productType, setProductType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          year: year === "all" ? undefined : Number(year),
          search: search.trim() || undefined,
        };
        const result = await getOrders(filters);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inattendue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, search]);

  const productTypes = useMemo(() => uniqueProductTypes(data), [data]);

  const filtered: OrdersByYear = useMemo(() => {
    const out: OrdersByYear = {};
    for (const [yr, orders] of Object.entries(data)) {
      const kept = orders
        .filter((o) => (status === "all" ? true : statusGroup(o.status) === status))
        .filter((o) =>
          productType === "all"
            ? true
            : (o.items ?? []).some((it) => it.productName === productType),
        );
      if (kept.length > 0) {
        out[yr] = kept.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    }
    return out;
  }, [data, status, productType]);

  const years = Object.keys(filtered).sort((a, b) => Number(b) - Number(a));
  const allYears = Object.keys(data).sort((a, b) => Number(b) - Number(a));
  const totalVisible = Object.values(filtered).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Mes commandes</h1>
        <p className="text-sm text-foreground/70">
          Retrouvez l&apos;historique de vos commandes, téléchargez vos factures et suivez leur
          statut.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par produit ou date (ex. 2024-01-15)"
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="sr-only">Année</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">Toutes les années</option>
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Statut</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Résiliées</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Produit</span>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            disabled={productTypes.length === 0}
          >
            <option value="all">Tous les produits</option>
            {productTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="card p-6">
          <p className="text-sm text-foreground/70">Chargement de vos commandes…</p>
        </div>
      )}

      {error && !loading && (
        <div className="card p-6">
          <p className="text-sm text-error">Impossible de charger vos commandes : {error}</p>
        </div>
      )}

      {!loading && !error && totalVisible === 0 && (
        <div className="card p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">Aucune commande trouvée.</p>
          <p className="text-sm text-foreground/70">
            Essayez de modifier vos filtres ou la recherche.
          </p>
        </div>
      )}

      {!loading && !error &&
        years.map((yr) => (
          <section key={yr} className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">{yr}</h2>
            <ul className="space-y-3">
              {filtered[yr].map((order) => (
                <li key={order.id}>
                  <OrderRow order={order} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function OrderRow({ order }: { order: OrderDTO }) {
  const items = order.items ?? [];
  const names = items.map((i) => i.productName).filter(Boolean);
  const summary =
    names.length === 0
      ? "Commande"
      : names.length === 1
        ? names[0]
        : `${names[0]} + ${names.length - 1} autre${names.length - 1 > 1 ? "s" : ""}`;
  const qty = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);

  return (
    <Link
      href={`/orders/${encodeURIComponent(order.id)}`}
      className="card block p-4 transition hover:ring-1 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{summary}</p>
          <p className="mt-1 text-xs text-foreground/60">
            {formatDate(order.createdAt)} · {qty} article{qty > 1 ? "s" : ""} · N°{" "}
            <span className="font-mono">{order.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(order.status)}`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className="text-sm font-semibold text-primary">
            {Number(order.total).toFixed(2)} {order.currency}
          </span>
        </div>
      </div>
    </Link>
  );
}
