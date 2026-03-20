"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    Package,
    ShoppingCart,
    Users,
    FolderOpen,
    Tag,
    MessageSquare,
    HelpCircle,
    TrendingUp,
    ArrowRight,
    LayoutDashboard,
    Home,
    Bot,
    FileText,
    Euro,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    AlertCircle,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Animated Counter Hook                                              */
/* ------------------------------------------------------------------ */
function useAnimatedCounter(target: number, duration = 1200) {
    const [value, setValue] = useState(0);
    const ref = useRef<number | null>(null);

    useEffect(() => {
        if (target === 0) { setValue(0); return; }
        const start = performance.now();
        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(Math.round(eased * target));
            if (progress < 1) ref.current = requestAnimationFrame(animate);
        };
        ref.current = requestAnimationFrame(animate);
        return () => { if (ref.current) cancelAnimationFrame(ref.current); };
    }, [target, duration]);

    return value;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface DashboardClientProps {
    productsCount: number;
    categoriesCount: number;
    orders: { id: string; total: number; currency: string; status: string; createdAt: string }[];
    stats: DashboardStats;
}

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */
const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    pending: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
    processing: { label: "En cours", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: AlertCircle },
    shipped: { label: "Expédié", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Truck },
    delivered: { label: "Livré", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    cancelled: { label: "Annulé", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status as OrderStatus] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            <Icon className="size-3" />
            {cfg.label}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */
function KpiCard({
    icon: Icon,
    label,
    value,
    gradient,
    delay,
    suffix,
    prefix,
}: {
    icon: typeof Package;
    label: string;
    value: number;
    gradient: string;
    delay: number;
    suffix?: string;
    prefix?: string;
}) {
    const animated = useAnimatedCounter(value);

    return (
        <div
            className="dashboard-card group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient accent bar */}
            <div className={`absolute inset-x-0 top-0 h-1 ${gradient}`} />

            {/* Shimmer on hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">
                        {prefix}{animated.toLocaleString("fr-FR")}{suffix}
                    </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="size-6" />
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Secondary Metric Card                                              */
/* ------------------------------------------------------------------ */
function SecondaryCard({
    icon: Icon,
    label,
    value,
    color,
    delay,
}: {
    icon: typeof Tag;
    label: string;
    value: number;
    color: string;
    delay: number;
}) {
    const animated = useAnimatedCounter(value, 800);

    return (
        <div
            className="dashboard-card group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="size-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-900">{animated}</p>
                <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Quick Nav Card                                                     */
/* ------------------------------------------------------------------ */
function NavCard({
    icon: Icon,
    title,
    description,
    href,
    gradient,
    delay,
}: {
    icon: typeof Package;
    title: string;
    description: string;
    href: string;
    gradient: string;
    delay: number;
}) {
    return (
        <Link
            href={href}
            className="dashboard-card group relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2`}>
                <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{title}</p>
                <p className="text-xs text-slate-500 truncate">{description}</p>
            </div>
            <ArrowRight className="size-4 text-slate-300 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Client Component                                         */
/* ------------------------------------------------------------------ */
export function DashboardClient({ productsCount, categoriesCount, orders, stats }: DashboardClientProps) {
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const recentOrders = orders.slice(0, 5);

    const now = new Date();
    const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";
    const dateStr = now.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="space-y-8">
            {/* ── Welcome Header ────────────────────────────── */}
            <div className="dashboard-card relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 p-8 text-white shadow-2xl shadow-slate-900/20">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />

                <div className="relative flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                                <LayoutDashboard className="size-5 text-blue-300" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">{greeting} 👋</h1>
                                <p className="text-sm text-blue-200/80 capitalize">{dateStr}</p>
                            </div>
                        </div>
                        <p className="mt-2 max-w-md text-sm text-slate-300">
                            Bienvenue sur votre tableau de bord. Voici un aperçu de l&apos;activité de votre boutique.
                        </p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                            <TrendingUp className="size-8 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Primary KPI Cards ─────────────────────────── */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard icon={Package} label="Produits" value={productsCount} gradient="bg-gradient-to-r from-blue-500 to-blue-600" delay={0} />
                <KpiCard icon={ShoppingCart} label="Commandes" value={orders.length} gradient="bg-gradient-to-r from-emerald-500 to-teal-600" delay={100} />
                <KpiCard icon={Euro} label="Chiffre d'affaires" value={Math.round(revenue)} gradient="bg-gradient-to-r from-violet-500 to-purple-600" delay={200} suffix=" €" />
                <KpiCard icon={Users} label="Utilisateurs" value={stats.usersCount} gradient="bg-gradient-to-r from-orange-500 to-amber-500" delay={300} />
            </div>

            {/* ── Secondary Metrics ─────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-3">
                <SecondaryCard icon={FolderOpen} label="Catégories" value={categoriesCount} color="bg-sky-500" delay={400} />
                <SecondaryCard icon={Tag} label="Codes promo actifs" value={stats.promoCodesCount} color="bg-pink-500" delay={500} />
                <SecondaryCard icon={MessageSquare} label="Messages en attente" value={stats.pendingMessages} color="bg-amber-500" delay={600} />
            </div>

            {/* ── Two-column layout: Orders + Nav ───────────── */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Recent Orders */}
                <div className="lg:col-span-3 dashboard-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" style={{ animationDelay: "500ms" }}>
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                <FileText className="size-4" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Commandes récentes</h2>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {orders.length} total
                        </span>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <ShoppingCart className="size-10 mb-3 opacity-40" />
                            <p className="text-sm font-medium">Aucune commande pour le moment</p>
                            <p className="text-xs">Les commandes apparaîtront ici</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-6 px-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">ID</th>
                                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                                        <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Statut</th>
                                        <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentOrders.map((order, i) => (
                                        <tr
                                            key={order.id}
                                            className="group transition-colors hover:bg-slate-50/50 dashboard-table-row"
                                            style={{ animationDelay: `${600 + i * 80}ms` }}
                                        >
                                            <td className="py-3.5 pr-4">
                                                <span className="font-mono text-sm font-semibold text-slate-700">{order.id.slice(0, 12)}…</span>
                                            </td>
                                            <td className="py-3.5 pr-4 text-sm text-slate-500">
                                                {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <span className="font-semibold text-slate-900">{order.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Navigation */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white">
                            <LayoutDashboard className="size-4" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Navigation rapide</h2>
                    </div>

                    <NavCard icon={Package} title="Produits" description="Gérer le catalogue" href="/backoffice/products" gradient="bg-gradient-to-br from-blue-500 to-blue-600" delay={600} />
                    <NavCard icon={FolderOpen} title="Catégories" description="Organiser les produits" href="/backoffice/categories" gradient="bg-gradient-to-br from-sky-500 to-cyan-600" delay={650} />
                    <NavCard icon={Users} title="Utilisateurs" description="Gestion des comptes" href="/backoffice/users" gradient="bg-gradient-to-br from-orange-500 to-amber-500" delay={700} />
                    <NavCard icon={Tag} title="Codes promo" description="Promotions et réductions" href="/backoffice/promo-codes" gradient="bg-gradient-to-br from-pink-500 to-rose-600" delay={750} />
                    <NavCard icon={Home} title="Page d'accueil" description="Contenu et carrousel" href="/backoffice/homepage" gradient="bg-gradient-to-br from-violet-500 to-purple-600" delay={800} />
                    <NavCard icon={HelpCircle} title="FAQ" description="Questions fréquentes" href="/backoffice/faq" gradient="bg-gradient-to-br from-emerald-500 to-teal-600" delay={850} />
                    <NavCard icon={Bot} title="Chatbot" description="Conversations IA" href="/backoffice/chatbot" gradient="bg-gradient-to-br from-indigo-500 to-blue-600" delay={900} />
                    <NavCard icon={MessageSquare} title="Messages" description="Support et contact" href="/backoffice/contact-messages" gradient="bg-gradient-to-br from-amber-500 to-yellow-500" delay={950} />
                </div>
            </div>

            {/* ── Quick Actions ─────────────────────────────── */}
            <div className="dashboard-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" style={{ animationDelay: "700ms" }}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                        <TrendingUp className="size-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Actions rapides</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: "Import produits (CSV)", icon: Package },
                        { label: "Mise à jour carrousel", icon: Home },
                        { label: "Publier page d'accueil", icon: FileText },
                    ].map(({ label, icon: BtnIcon }) => (
                        <button
                            key={label}
                            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                        >
                            <BtnIcon className="size-4 transition-transform group-hover:scale-110" />
                            {label}
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                    Ces actions appelleront les endpoints NestJS protégés (auth admin requise).
                </p>
            </div>
        </div>
    );
}
