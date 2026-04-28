"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { AddressList } from "@/components/account/AddressList";
import { PaymentMethodList } from "@/components/account/PaymentMethodList";
import { authFetch } from "@/lib/auth";
import {
  getOrders,
  type OrderDTO,
  type OrderStatus,
  type OrdersByYear,
} from "@/lib/api";
import { useT } from "@/context/LocaleContext";
import { isPasswordTooWeakApiMessage, firstHttpErrorMessage } from "@/lib/password-api-error";
import { passwordMeetsPolicy, getPasswordMissingSummary } from "@/lib/password-policy";
import { PasswordRequirementHints } from "@/components/account/PasswordRequirementHints";

type Section = "profile" | "addresses" | "payments" | "orders" | "security";

const SECTION_META: Record<
  Section,
  { label: string; hint: string; Icon: ComponentType<{ className?: string }> }
> = {
  profile: {
    label: "profile.section.profile.label",
    hint: "profile.section.profile.hint",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <circle cx="8" cy="6" r="3" />
        <path d="M2.5 14c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" />
      </svg>
    ),
  },
  addresses: {
    label: "profile.section.addresses.label",
    hint: "profile.section.addresses.hint",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5c0-2.5-2-4.5-4.5-4.5Z" />
        <circle cx="8" cy="6" r="1.6" />
      </svg>
    ),
  },
  payments: {
    label: "profile.section.payments.label",
    hint: "profile.section.payments.hint",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
        <path d="M2 6.5h12M5 10h2" />
      </svg>
    ),
  },
  orders: {
    label: "profile.section.orders.label",
    hint: "profile.section.orders.hint",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <path d="M2 3h2l1.5 8h7L14 5H5" />
        <circle cx="6" cy="14" r="1" />
        <circle cx="12" cy="14" r="1" />
      </svg>
    ),
  },
  security: {
    label: "profile.section.security.label",
    hint: "profile.section.security.hint",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <rect x="3" y="7" width="10" height="7" rx="1.4" />
        <path d="M5 7V5a3 3 0 0 1 6 0v2" />
      </svg>
    ),
  },
};

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileShell />
    </AuthGuard>
  );
}

function ProfileShell() {
  const t = useT();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("profile");

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    t("profile.welcomeFallback");
  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    (user?.email?.slice(0, 2).toUpperCase() ?? "?");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-7">
      {/* Breadcrumb */}
      <nav
        aria-label={t("auth.login.breadcrumbLabel")}
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          {t("common.home")}
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">{t("account.profile")}</span>
      </nav>

      {/* Profile hero */}
      <section className="relative isolate overflow-hidden rounded-[18px] bg-gradient-to-br from-foreground to-[#00253a] px-7 py-9 text-white md:px-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(0, 168, 181, 0.45) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 0% 100%, rgba(0, 168, 181, 0.18) 0%, transparent 55%)",
          }}
        />

        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 font-heading text-2xl font-bold uppercase text-white shadow-[0_2px_18px_rgba(0,168,181,0.4)] ring-1 ring-white/15 backdrop-blur-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#b3eef2]">
              <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary-hover" />
              {t("account.title")}
            </p>
            <h1 className="mt-1 font-heading text-[28px] font-semibold leading-tight tracking-tight md:text-[34px]">
              {t("profile.hello")}, {fullName}
            </h1>
            {user?.email && (
              <p className="mt-1 text-[13.5px] text-white/70">
                {user.email}
                {user.role === "admin" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                    {t("header.admin")}
                  </span>
                )}
              </p>
            )}
          </div>
          <Link
            href="/orders"
            className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white transition hover:border-primary-hover hover:bg-primary/30 sm:inline-flex"
            style={{ color: "#fff" }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M2 3h2l1.5 8h7L14 5H5" />
              <circle cx="6" cy="14" r="1" />
              <circle cx="12" cy="14" r="1" />
            </svg>
            {t("header.orders")}
          </Link>
        </div>
      </section>

      {/* Main grid: sidebar + content */}
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-44">
          <nav
            aria-label={t("profile.sectionsAria")}
            className="overflow-hidden rounded-2xl border border-foreground/10 bg-white p-1.5"
          >
            <ul className="flex flex-col gap-0.5" role="list">
              {(Object.keys(SECTION_META) as Section[]).map((key) => {
                const meta = SECTION_META[key];
                const isActive = section === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setSection(key)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        isActive
                          ? "bg-background font-semibold text-foreground"
                          : "text-foreground hover:bg-background/60 hover:text-primary"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                          isActive ? "bg-primary text-white" : "bg-background/80 text-foreground/65"
                        }`}
                        style={isActive ? { color: "#fff" } : undefined}
                      >
                        <meta.Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold leading-tight">
                          {t(meta.label as never)}
                        </span>
                        <span
                          className={`mt-0.5 block text-[11.5px] ${
                            isActive ? "text-foreground/65" : "text-foreground/55"
                          }`}
                        >
                          {t(meta.hint as never)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-1.5 border-t border-foreground/5 p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-foreground/70 transition hover:bg-error/10 hover:text-error"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3.5 w-3.5">
                  <path d="M6 2H3v12h3M10 5l3 3-3 3M6 8h7" />
                </svg>
                {t("header.logout")}
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 space-y-5">
          {section === "profile" && <PersonalInfoCard />}
          {section === "addresses" && (
            <SectionCard
              eyebrow={t("profile.addressBookEyebrow")}
              title={t("profile.addressBookTitle")}
              hint={t("profile.addressBookHint")}
            >
              <AddressList />
            </SectionCard>
          )}
          {section === "payments" && (
            <SectionCard
              eyebrow={t("profile.paymentMethodsEyebrow")}
              title={t("profile.paymentMethodsTitle")}
              hint={t("profile.paymentMethodsHint")}
            >
              <PaymentMethodList />
            </SectionCard>
          )}
          {section === "orders" && <OrdersShortcut />}
          {section === "security" && <SecurityCard />}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable section card ───────────────────────────────────── */
function SectionCard({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      <header className="border-b border-foreground/5 px-6 py-5">
        <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h2 className="font-heading text-[20px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <p className="mt-1 text-[13px] text-foreground/60">{hint}</p>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

/* ── Personal info ───────────────────────────────────────────── */
function PersonalInfoCard() {
  const { user, updateUser } = useAuth();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [resending, setResending] = useState(false);

  const flashAndClear = (kind: "success" | "error", text: string) => {
    setFlash({ kind, text });
    window.setTimeout(() => setFlash(null), 3500);
  };

  // Hydrate pendingEmail from /profile/me on mount so the banner appears even after a reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/profile/me");
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!cancelled) {
          updateUser({
            pendingEmail:
              typeof data.pendingEmail === "string" || data.pendingEmail === null
                ? (data.pendingEmail as string | null)
                : undefined,
          });
        }
      } catch {
        // best-effort hydration only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const save = async (
    patch: Partial<{ firstName: string; lastName: string; email: string }>,
  ) => {
    const res = await authFetch("/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message =
        typeof data?.message === "string" ? data.message : "Mise à jour impossible.";
      throw new Error(message);
    }
    updateUser({
      firstName: typeof data.firstName === "string" ? data.firstName : undefined,
      lastName: typeof data.lastName === "string" ? data.lastName : undefined,
      email: typeof data.email === "string" ? data.email : undefined,
      pendingEmail:
        typeof data.pendingEmail === "string" || data.pendingEmail === null
          ? (data.pendingEmail as string | null)
          : undefined,
    });
    if (typeof data.pendingEmail === "string" && data.pendingEmail) {
      flashAndClear(
        "success",
        `Un e-mail de confirmation a été envoyé à ${data.pendingEmail}.`,
      );
    } else {
      flashAndClear("success", "Informations mises à jour.");
    }
  };

  const resendEmailChange = async () => {
    if (resending) return;
    setResending(true);
    try {
      const res = await authFetch("/profile/me/resend-email-change", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const message =
          typeof data?.message === "string" ? data.message : "Renvoi impossible.";
        throw new Error(message);
      }
      flashAndClear("success", "Lien de confirmation renvoyé.");
    } catch (e) {
      flashAndClear("error", (e as Error).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SectionCard
      eyebrow="Informations personnelles"
      title="Vos coordonnées"
      hint="Cliquez sur l'icône crayon pour modifier un champ. Utilisé pour vos commandes et notifications."
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <EditableField
          label="Prénom"
          value={user?.firstName ?? ""}
          placeholder="—"
          onSave={(v) => save({ firstName: v })}
          onError={(e) => flashAndClear("error", e)}
        />
        <EditableField
          label="Nom"
          value={user?.lastName ?? ""}
          placeholder="—"
          onSave={(v) => save({ lastName: v })}
          onError={(e) => flashAndClear("error", e)}
        />
        <EditableField
          label="Email"
          value={user?.email ?? ""}
          type="email"
          placeholder="vous@exemple.fr"
          onSave={(v) => save({ email: v })}
          onError={(e) => flashAndClear("error", e)}
        />
        {user?.pendingEmail && (
          <div
            role="status"
            className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900"
          >
            <span>
              En attente de validation : <b>{user.pendingEmail}</b>. Vérifiez la nouvelle boîte mail pour confirmer le changement.
            </span>
            <button
              type="button"
              onClick={() => void resendEmailChange()}
              disabled={resending}
              className="inline-flex items-center rounded-md border border-amber-400 bg-white px-2.5 py-1 text-[12px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
            >
              {resending ? "Envoi…" : "Renvoyer"}
            </button>
          </div>
        )}
        <ReadOnlyField label="Rôle">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              user?.role === "admin"
                ? "bg-primary/10 text-primary"
                : "bg-background text-foreground/70"
            }`}
          >
            {user?.role === "admin" ? "Administrateur" : "Client"}
          </span>
        </ReadOnlyField>
        <ReadOnlyField label="Identifiant">
          <span className="font-mono text-[12px] text-foreground/65">
            {user?.id?.slice(0, 8) ?? "—"}
          </span>
        </ReadOnlyField>
      </dl>

      {flash && (
        <div
          role="status"
          className={`mt-5 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] ${
            flash.kind === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {flash.kind === "success" ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="m3 8 3.5 3.5L13 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="8" cy="8" r="6" />
              <path d="m4.5 4.5 7 7" />
            </svg>
          )}
          {flash.text}
        </div>
      )}
    </SectionCard>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-background/30 px-4 py-3.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/55">
        {label}
      </dt>
      <dd className="mt-1.5 text-[14px] font-medium text-foreground">{children}</dd>
    </div>
  );
}

function EditableField({
  label,
  value,
  placeholder = "—",
  type = "text",
  onSave,
  onError,
  className = "",
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email";
  onSave: (next: string) => Promise<void>;
  onError: (msg: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const next = draft.trim();
    if (!next) {
      onError("Le champ ne peut pas être vide.");
      return;
    }
    if (next === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`group relative rounded-xl border border-foreground/10 bg-background/30 px-4 py-3.5 transition focus-within:border-primary/40 focus-within:bg-white ${className}`}
    >
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/55">
        {label}
      </dt>
      {editing ? (
        <form onSubmit={submit} className="mt-1.5 flex items-center gap-2">
          <input
            type={type}
            value={draft}
            autoFocus
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
            }}
            className="min-w-0 flex-1 rounded-md border border-foreground/15 bg-white px-2.5 py-1.5 text-[14px] font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            disabled={saving}
            aria-label="Enregistrer"
            style={{ color: "#fff" }}
            className="grid h-8 w-8 place-items-center rounded-md bg-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="m3 8 3.5 3.5L13 5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            aria-label="Annuler"
            className="grid h-8 w-8 place-items-center rounded-md border border-foreground/15 bg-white text-foreground/65 transition hover:border-error/30 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M4 4l8 8M12 4 4 12" />
            </svg>
          </button>
        </form>
      ) : (
        <dd className="mt-1.5 flex items-center justify-between gap-2 text-[14px] font-medium text-foreground">
          <span className={value ? "" : "text-foreground/45"}>{value || placeholder}</span>
          <button
            type="button"
            onClick={startEdit}
            aria-label={`Modifier ${label.toLowerCase()}`}
            className="grid h-7 w-7 place-items-center rounded-md text-foreground/55 transition hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M3 13h3L13 6l-3-3L3 10v3z" />
              <path d="m9 4 3 3" />
            </svg>
          </button>
        </dd>
      )}
    </div>
  );
}

/* ── Orders shortcut ────────────────────────────────────────── */

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  processing: "En traitement",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "processing", "shipped"];

function statusTone(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-success/10 text-success";
    case "cancelled":
      return "bg-error/10 text-error";
    case "shipped":
      return "bg-foreground/10 text-foreground";
    default:
      return "bg-primary/10 text-primary";
  }
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function OrdersShortcut() {
  const t = useT();
  const [data, setData] = useState<OrdersByYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getOrders();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("orders.errorUnexpected"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const flat = useMemo<OrderDTO[]>(() => {
    if (!data) return [];
    return Object.values(data).flat() as OrderDTO[];
  }, [data]);

  const counts = useMemo(() => {
    const r = { active: 0, delivered: 0, cancelled: 0 };
    for (const o of flat) {
      if (ACTIVE_STATUSES.includes(o.status)) r.active += 1;
      else if (o.status === "delivered") r.delivered += 1;
      else if (o.status === "cancelled") r.cancelled += 1;
    }
    return r;
  }, [flat]);

  const recent = useMemo(
    () =>
      [...flat]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 4),
    [flat],
  );

  return (
    <SectionCard
      eyebrow={t("profile.ordersEyebrow")}
      title={t("profile.ordersTitle")}
      hint={t("profile.ordersHint")}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusTile color="primary" label={t("orders.statusActive")} value={counts.active} hint={t("profile.orders.activeHint")} />
        <StatusTile color="success" label={t("orders.statusCompleted")} value={counts.delivered} hint={t("orders.statusLabel.delivered")} />
        <StatusTile color="error" label={t("orders.statusCancelled")} value={counts.cancelled} hint={t("orders.statusLabel.cancelled")} />
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-8 text-center text-sm text-foreground/55">
          {t("orders.loading")}
        </div>
      ) : error ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-[13px] text-error">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
            <circle cx="8" cy="8" r="6" />
            <path d="m4.5 4.5 7 7" />
          </svg>
          {error}
        </div>
      ) : flat.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-8 text-center text-sm text-foreground/55">
          {t("orders.empty.title")}
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h3 className="font-heading text-[14px] font-semibold text-foreground">
              {t("profile.orders.latest")}
            </h3>
            <span className="text-[11.5px] text-foreground/55">
              {flat.length} {t("profile.orders.total")}
            </span>
          </div>
          <ul className="divide-y divide-foreground/5 overflow-hidden rounded-xl border border-foreground/10" role="list">
            {recent.map((o) => {
              const number = o.orderNumber ?? `ALT-${o.id.slice(0, 8).toUpperCase()}`;
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${encodeURIComponent(o.id)}`}
                    className="grid grid-cols-[1fr_auto_auto_28px] items-center gap-3 px-4 py-3 transition hover:bg-background/40"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] font-semibold text-foreground">
                        {number}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-foreground/55">
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(o.status)}`}
                    >
                      <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-current" />
                      {t(({
                        pending: "orders.statusLabel.pending",
                        processing: "orders.statusLabel.processing",
                        shipped: "orders.statusLabel.shipped",
                        delivered: "orders.statusLabel.delivered",
                        cancelled: "orders.statusLabel.cancelled",
                      } as const)[o.status])}
                    </span>
                    <span className="font-heading text-[13.5px] font-bold tabular-nums text-foreground">
                      {formatPrice(Number(o.total), o.currency)}
                    </span>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5 justify-self-end text-foreground/35">
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link
        href="/orders"
        style={{ color: "#fff" }}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover"
      >
        {t("profile.orders.seeAll")}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
          <path d="M3 8h10m-3-3 3 3-3 3" />
        </svg>
      </Link>
    </SectionCard>
  );
}

function StatusTile({
  color,
  label,
  value,
  hint,
}: {
  color: "primary" | "success" | "error";
  label: string;
  value: number;
  hint: string;
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    error: "bg-error/10 text-error",
  }[color];
  return (
    <div className="rounded-xl border border-foreground/10 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${cls}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
            <path d="M2 3h2l1.5 8h7L14 5H5" />
            <circle cx="6" cy="14" r="1" />
            <circle cx="12" cy="14" r="1" />
          </svg>
        </span>
        <span className="font-heading text-[22px] font-bold tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <p className="mt-2 font-heading text-[14px] font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] text-foreground/55">{hint}</p>
    </div>
  );
}

/* ── Security ──────────────────────────────────────────────── */
function SecurityCard() {
  const t = useT();
  const { user } = useAuth();

  return (
    <>
      <SectionCard
        eyebrow={t("profile.security.passwordEyebrow")}
        title={t("profile.security.passwordTitle")}
        hint={t("profile.security.passwordHint")}
      >
        <ChangePasswordForm />
        <p className="mt-4 text-[12.5px] text-foreground/60">
          {t("profile.security.forgot")}{" "}
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            {t("profile.security.resetLink")}
          </Link>{" "}
          {t("profile.security.to")} <b className="font-semibold text-foreground">{user?.email ?? t("profile.security.yourEmail")}</b> ({t("profile.security.valid24h")}).
        </p>
      </SectionCard>

      <MfaCard />

      <SectionCard
        eyebrow={t("profile.security.sessionsEyebrow")}
        title={t("profile.security.sessionsTitle")}
        hint={t("profile.security.sessionsHint")}
      >
        <div className="rounded-xl border border-foreground/10 bg-background/30 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-success/10 text-success">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <rect x="2" y="3.5" width="12" height="8" rx="1" />
                <path d="M5 14h6M8 11.5V14" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-foreground">{t("profile.security.sessionActive")}</p>
              <p className="text-[11.5px] text-foreground/55">{t("profile.security.thisDeviceNow")}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-success" />
              {t("orders.statusActive")}
            </span>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

/* ── MFA enrollment & disable ────────────────────────────────── */
type MfaStatus = "loading" | "disabled" | "enabled";
interface MfaSetupPayload {
  qrDataUrl: string;
  otpauthUrl: string;
  secret: string;
  backupCodes: string[];
}

function MfaCard() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [backupRemaining, setBackupRemaining] = useState<number>(0);
  const [setupData, setSetupData] = useState<MfaSetupPayload | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const refresh = async () => {
    try {
      const res = await authFetch("/profile/me");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        mfaEnabled?: boolean;
        mfaBackupCodesRemaining?: number;
      };
      setStatus(data.mfaEnabled ? "enabled" : "disabled");
      setBackupRemaining(data.mfaBackupCodesRemaining ?? 0);
    } catch {
      setStatus("disabled");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const startSetup = async () => {
    setFlash(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/auth/mfa/setup", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as Partial<MfaSetupPayload> & {
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Initialisation impossible.");
      if (!data.qrDataUrl || !data.secret || !data.backupCodes) throw new Error("Réponse invalide.");
      setSetupData(data as MfaSetupPayload);
      setCode("");
    } catch (err) {
      setFlash({
        kind: "error",
        text: err instanceof Error ? err.message : "Initialisation impossible.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSetup = async (e: FormEvent) => {
    e.preventDefault();
    setFlash(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Code incorrect.");
      setFlash({
        kind: "success",
        text:
          "MFA activée. Une connexion future demandera votre code à 6 chiffres ou un code de secours.",
      });
      setSetupData(null);
      setCode("");
      await refresh();
    } catch (err) {
      setFlash({
        kind: "error",
        text: err instanceof Error ? err.message : "Vérification impossible.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disable = async (e: FormEvent) => {
    e.preventDefault();
    setFlash(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Code incorrect.");
      setFlash({ kind: "success", text: "MFA désactivée." });
      setCode("");
      await refresh();
    } catch (err) {
      setFlash({
        kind: "error",
        text: err instanceof Error ? err.message : "Désactivation impossible.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadBackupCodes = (codes: string[]) => {
    const body = [
      "Codes de secours Althea Systems",
      "Chaque code est utilisable une seule fois.",
      "",
      ...codes,
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "althea-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls =
    "w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
  const labelCls =
    "mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65";

  return (
    <SectionCard
      eyebrow="Authentification à deux facteurs"
      title="MFA — Application d'authentification"
      hint="Une couche de sécurité supplémentaire à la connexion : votre mot de passe + un code à 6 chiffres généré par Google Authenticator, Authy, 1Password, etc."
    >
      {flash && (
        <div
          role={flash.kind === "error" ? "alert" : "status"}
          className={`mb-4 rounded-lg border px-3.5 py-2.5 text-[13px] ${
            flash.kind === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {flash.text}
        </div>
      )}

      {status === "loading" && (
        <p className="text-[13px] text-foreground/55">Chargement…</p>
      )}

      {/* SETUP IN PROGRESS — show QR + backup codes + verification input */}
      {setupData && (
        <div className="aso-anim-fade-rise space-y-5">
          <div className="grid gap-5 sm:grid-cols-[auto,1fr]">
            <div className="rounded-xl border border-foreground/10 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setupData.qrDataUrl}
                alt="QR code MFA"
                width={180}
                height={180}
                className="h-[180px] w-[180px]"
              />
            </div>
            <div className="space-y-3 text-[13px] text-foreground/75">
              <p className="font-semibold text-foreground">
                Étape 1 — Scannez le QR code
              </p>
              <p>
                Ouvrez votre application d&apos;authentification (Google Authenticator,
                Authy, 1Password…) puis scannez ce QR code.
              </p>
              <div className="rounded-lg border border-foreground/10 bg-background/40 px-3 py-2">
                <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/55">
                  Saisie manuelle
                </p>
                <code className="block break-all font-mono text-[12px] text-foreground/85">
                  {setupData.secret}
                </code>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3.5">
            <p className="mb-2 text-[13px] font-semibold text-foreground">
              Étape 2 — Conservez vos codes de secours
            </p>
            <p className="mb-3 text-[12.5px] text-foreground/70">
              Ces 8 codes vous permettent de vous connecter si vous perdez l&apos;accès à
              votre application. <b>Ils ne seront affichés qu&apos;une seule fois.</b>{" "}
              Téléchargez-les ou copiez-les avant de continuer.
            </p>
            <div className="grid gap-2 font-mono text-[12.5px] sm:grid-cols-2">
              {setupData.backupCodes.map((c) => (
                <code
                  key={c}
                  className="rounded-md border border-foreground/10 bg-white px-2.5 py-1.5 text-foreground/85"
                >
                  {c}
                </code>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadBackupCodes(setupData.backupCodes)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-foreground/75 hover:bg-foreground/5"
              >
                Télécharger (.txt)
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
                  setFlash({ kind: "success", text: "Codes copiés dans le presse-papiers." });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-foreground/75 hover:bg-foreground/5"
              >
                Copier
              </button>
            </div>
          </div>

          <form onSubmit={confirmSetup} className="space-y-3">
            <div>
              <label htmlFor="mfa-setup-code" className={labelCls}>
                Étape 3 — Code à 6 chiffres
              </label>
              <input
                id="mfa-setup-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123 456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputCls} font-mono tracking-[0.2em]`}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                style={{ color: "#fff" }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold transition hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? "Vérification…" : "Activer la MFA"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSetupData(null);
                  setCode("");
                  setFlash(null);
                }}
                className="rounded-lg border border-foreground/10 bg-white px-4 py-2 text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DISABLED, NO SETUP IN PROGRESS — show CTA */}
      {!setupData && status === "disabled" && (
        <div className="space-y-3">
          <p className="text-[13px] text-foreground/70">
            La MFA n&apos;est pas activée sur votre compte.
          </p>
          <button
            type="button"
            onClick={() => void startSetup()}
            disabled={submitting}
            style={{ color: "#fff" }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold transition hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Initialisation…" : "Activer la MFA"}
          </button>
        </div>
      )}

      {/* ENABLED — show status + disable form */}
      {!setupData && status === "enabled" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="m3 8 3.5 3.5L13 5" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-foreground">
                MFA activée
              </p>
              <p className="text-[11.5px] text-foreground/65">
                {backupRemaining} code{backupRemaining > 1 ? "s" : ""} de secours restant
                {backupRemaining > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <form onSubmit={disable} className="space-y-3">
            <div>
              <label htmlFor="mfa-disable-code" className={labelCls}>
                Désactiver — saisir un code à 6 chiffres pour confirmer
              </label>
              <input
                id="mfa-disable-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123 456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputCls} font-mono tracking-[0.2em]`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-[13px] font-semibold text-error transition hover:bg-error/10 disabled:opacity-60"
            >
              {submitting ? "Désactivation…" : "Désactiver la MFA"}
            </button>
          </form>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Change-password form ───────────────────────────────────── */
function ChangePasswordForm() {
  const t = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFlash(null);
    if (!passwordMeetsPolicy(next)) {
      setFlash({
        kind: "error",
        text: getPasswordMissingSummary(next, t) || t("auth.password.tooWeak"),
      });
      return;
    }
    if (next !== confirm) {
      setFlash({ kind: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("/profile/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        if (isPasswordTooWeakApiMessage(data.message)) {
          setFlash({
            kind: "error",
            text: getPasswordMissingSummary(next, t) || t("auth.password.tooWeak"),
          });
          return;
        }
        setFlash({
          kind: "error",
          text: firstHttpErrorMessage(data.message) ?? t("account.passwordChangeErrorGeneric"),
        });
        return;
      }
      setFlash({ kind: "success", text: "Mot de passe mis à jour." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setFlash({
        kind: "error",
        text: err instanceof Error ? err.message : t("account.passwordChangeErrorGeneric"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
  const labelCls =
    "mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65";

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="pw-current" className={labelCls}>
          Mot de passe actuel
        </label>
        <input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="pw-new" className={labelCls}>
          Nouveau mot de passe
        </label>
        <div className="relative">
          <input
            id="pw-new"
            type={showNext ? "text" : "password"}
            autoComplete="new-password"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowNext((s) => !s)}
            aria-label={showNext ? "Masquer" : "Afficher"}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-foreground/55 transition hover:bg-background hover:text-primary"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3.5 w-3.5">
              {showNext ? (
                <>
                  <path d="M2 2l12 12" />
                  <path d="M3 8s2-4 5-4M13 8s-2 4-5 4" />
                </>
              ) : (
                <>
                  <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
                  <circle cx="8" cy="8" r="2" />
                </>
              )}
            </svg>
          </button>
        </div>
        <PasswordRequirementHints password={next} />
      </div>

      <div>
        <label htmlFor="pw-confirm" className={labelCls}>
          Confirmer
        </label>
        <input
          id="pw-confirm"
          type={showNext ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
      </div>

      {flash && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] sm:col-span-2 ${
            flash.kind === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {flash.kind === "success" ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="m3 8 3.5 3.5L13 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="8" cy="8" r="6" />
              <path d="m4.5 4.5 7 7" />
            </svg>
          )}
          {flash.text}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{ color: "#fff" }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:w-fit"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Mise à jour…
          </>
        ) : (
          <>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="m3 8 3.5 3.5L13 5" />
            </svg>
            Mettre à jour le mot de passe
          </>
        )}
      </button>
    </form>
  );
}
