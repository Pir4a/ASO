"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { AddressList } from "@/components/account/AddressList";
import { PaymentMethodList } from "@/components/account/PaymentMethodList";

type Section = "profile" | "addresses" | "payments" | "orders" | "security";

const SECTION_META: Record<
  Section,
  { label: string; hint: string; Icon: ComponentType<{ className?: string }> }
> = {
  profile: {
    label: "Informations",
    hint: "Nom, email",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <circle cx="8" cy="6" r="3" />
        <path d="M2.5 14c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" />
      </svg>
    ),
  },
  addresses: {
    label: "Adresses",
    hint: "Carnet d'adresses",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5c0-2.5-2-4.5-4.5-4.5Z" />
        <circle cx="8" cy="6" r="1.6" />
      </svg>
    ),
  },
  payments: {
    label: "Paiements",
    hint: "Cartes & comptes",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
        <path d="M2 6.5h12M5 10h2" />
      </svg>
    ),
  },
  orders: {
    label: "Mes commandes",
    hint: "Historique & suivi",
    Icon: ({ className }) => (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
        <path d="M2 3h2l1.5 8h7L14 5H5" />
        <circle cx="6" cy="14" r="1" />
        <circle cx="12" cy="14" r="1" />
      </svg>
    ),
  },
  security: {
    label: "Sécurité",
    hint: "Mot de passe",
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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("profile");

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Bienvenue";
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
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">Mon profil</span>
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
              Mon compte
            </p>
            <h1 className="mt-1 font-heading text-[28px] font-semibold leading-tight tracking-tight md:text-[34px]">
              Bonjour, {fullName}
            </h1>
            {user?.email && (
              <p className="mt-1 text-[13.5px] text-white/70">
                {user.email}
                {user.role === "admin" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                    Admin
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
            Mes commandes
          </Link>
        </div>
      </section>

      {/* Main grid: sidebar + content */}
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-44">
          <nav
            aria-label="Sections du compte"
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
                          {meta.label}
                        </span>
                        <span
                          className={`mt-0.5 block text-[11.5px] ${
                            isActive ? "text-foreground/65" : "text-foreground/55"
                          }`}
                        >
                          {meta.hint}
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
                Se déconnecter
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 space-y-5">
          {section === "profile" && <PersonalInfoCard />}
          {section === "addresses" && (
            <SectionCard
              eyebrow="Carnet d'adresses"
              title="Adresses de livraison & facturation"
              hint="Ajoutez plusieurs adresses pour accélérer vos commandes."
            >
              <AddressList />
            </SectionCard>
          )}
          {section === "payments" && (
            <SectionCard
              eyebrow="Méthodes de paiement"
              title="Cartes enregistrées"
              hint="Ajoutez ou retirez vos cartes. Données chiffrées (PCI-DSS)."
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
  const { user } = useAuth();

  return (
    <SectionCard
      eyebrow="Informations personnelles"
      title="Vos coordonnées"
      hint="Utilisées pour vos commandes et notifications."
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet">
          {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"}
        </Field>
        <Field label="Email">{user?.email || "—"}</Field>
        <Field label="Rôle">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              user?.role === "admin"
                ? "bg-primary/10 text-primary"
                : "bg-background text-foreground/70"
            }`}
          >
            {user?.role === "admin" ? "Administrateur" : "Client"}
          </span>
        </Field>
        <Field label="Identifiant">
          <span className="font-mono text-[12px] text-foreground/65">
            {user?.email?.split("@")[0] ?? "—"}
          </span>
        </Field>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-foreground/15 bg-background/40 px-4 py-3 text-[12.5px] text-foreground/70">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-4 w-4 text-primary">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 7v4M8 5v.01" />
        </svg>
        La modification du nom et de l&apos;email sera bientôt disponible. Pour toute mise à jour
        urgente, contactez-nous via la page{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          Contact
        </Link>
        .
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-background/30 px-4 py-3.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/55">
        {label}
      </dt>
      <dd className="mt-1.5 text-[14px] font-medium text-foreground">{children}</dd>
    </div>
  );
}

/* ── Orders shortcut ────────────────────────────────────────── */
function OrdersShortcut() {
  return (
    <SectionCard
      eyebrow="Commandes"
      title="Historique de vos achats"
      hint="Suivi de livraison, statut et téléchargement de factures."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusTile color="primary" label="En cours" hint="Pending · processing · shipped" />
        <StatusTile color="success" label="Terminées" hint="Livrées" />
        <StatusTile color="error" label="Annulées" hint="Cancelled" />
      </div>
      <Link
        href="/orders"
        style={{ color: "#fff" }}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover"
      >
        Voir toutes mes commandes
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
  hint,
}: {
  color: "primary" | "success" | "error";
  label: string;
  hint: string;
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    error: "bg-error/10 text-error",
  }[color];
  return (
    <div className="rounded-xl border border-foreground/10 bg-white px-4 py-4">
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
      <p className="mt-3 font-heading text-[15px] font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-[11.5px] text-foreground/55">{hint}</p>
    </div>
  );
}

/* ── Security ──────────────────────────────────────────────── */
function SecurityCard() {
  const { user } = useAuth();

  return (
    <>
      <SectionCard
        eyebrow="Mot de passe"
        title="Sécurité du compte"
        hint="Réinitialisez votre mot de passe par email pour des raisons de sécurité."
      >
        <p className="text-[13.5px] leading-relaxed text-foreground/70">
          Pour des raisons de sécurité, le changement de mot de passe se fait via un lien à usage
          unique envoyé à <b className="font-semibold text-foreground">{user?.email ?? "votre email"}</b>.
          Le lien est valable 24 heures.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/forgot-password"
            style={{ color: "#fff" }}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="6" cy="10" r="2.5" />
              <path d="m13.5 2.5-6 6M10 5l3 3" />
            </svg>
            Réinitialiser mon mot de passe
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-foreground/15 bg-white px-5 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            Contacter le support
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Sessions"
        title="Vos appareils connectés"
        hint="Si vous remarquez une activité suspecte, déconnectez-vous puis réinitialisez votre mot de passe."
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
              <p className="text-[13.5px] font-semibold text-foreground">Session active</p>
              <p className="text-[11.5px] text-foreground/55">Cet appareil · maintenant</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-success" />
              En cours
            </span>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
