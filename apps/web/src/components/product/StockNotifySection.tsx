"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { authFetch } from "@/lib/auth";
import { useT } from "@/context/LocaleContext";

export function StockNotifySection({ productId }: { productId: string }) {
  const t = useT();
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "dup" | "err">("idle");

  async function submit(overrideEmail?: string) {
    const bodyEmail = isAuthenticated ? undefined : overrideEmail ?? email;
    if (!isAuthenticated && !bodyEmail?.trim()) {
      setStatus("err");
      return;
    }
    setStatus("loading");
    const body =
      bodyEmail?.trim()
        ? JSON.stringify({ email: bodyEmail.trim() })
        : JSON.stringify({});
    const url = `${API_URL}/products/${productId}/stock-notify`;
    try {
      const res = isAuthenticated
        ? await authFetch(`/products/${productId}/stock-notify`, {
            method: "POST",
            body,
          })
        : await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });

      const data = (await res.json().catch(() => ({}))) as { duplicate?: boolean };

      if (res.ok && data.duplicate === true) setStatus("dup");
      else if (res.ok) setStatus("ok");
      else if (res.status === 400) setStatus("err");
      else setStatus("err");
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <p className="rounded-lg bg-success/10 px-4 py-3 text-[14px] font-medium text-success">
        {t("products.notify.success")}
      </p>
    );
  }
  if (status === "dup") {
    return (
      <p className="rounded-lg bg-foreground/[0.06] px-4 py-3 text-[14px] font-medium text-foreground/75">
        {t("products.notify.successDuplicate")}
      </p>
    );
  }

  if (isAuthenticated && user?.email) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-foreground/65">{t("products.notify.hintLoggedIn")}</p>
        <p className="text-[13px] font-medium text-foreground">{user.email}</p>
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void submit()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
              <path d="M2.5 3.5h11v9h-11v-9Z" />
              <path d="m2.5 4 5 3.25 5-3.25" />
            </svg>
          )}
          {t("products.notify.cta")}
        </button>
        {status === "err" && (
          <p className="text-[13px] font-medium text-error" role="alert">
            {t("products.notify.error")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-background/40 p-4">
      <label htmlFor="stock-notify-email" className="text-[13px] font-semibold text-foreground/80">
        {t("products.notify.emailLabel")}
      </label>
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          id="stock-notify-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "err") setStatus("idle");
          }}
          placeholder={t("products.notify.emailPlaceholder")}
          className="min-h-12 min-w-[200px] flex-1 rounded-lg border border-foreground/15 bg-white px-3 text-[14px] text-foreground outline-none ring-primary/40 focus:border-primary focus:ring-2"
        />
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void submit()}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          ) : (
            t("products.notify.cta")
          )}
        </button>
      </div>
      {status === "err" && (
        <p className="text-[13px] font-medium text-error" role="alert">
          {email.trim() ? t("products.notify.error") : t("products.notify.errorEmail")}
        </p>
      )}
    </div>
  );
}
