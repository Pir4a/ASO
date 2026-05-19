"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { authFetch } from "@/lib/auth";
import { useT } from "@/context/LocaleContext";

type UiStatus = "idle" | "loading" | "ok" | "dup" | "err" | "unsub_ok";

export function StockNotifySection({ productId }: { productId: string }) {
  const t = useT();
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<UiStatus>("idle");
  const [subscribed, setSubscribed] = useState(false);
  const [activeEmail, setActiveEmail] = useState("");

  const resolvedEmail = (
    isAuthenticated && user?.email ? user.email : activeEmail || email
  ).trim();

  const fetchStatus = useCallback(
    async (checkEmail: string) => {
      const q = encodeURIComponent(checkEmail);
      const path = `/products/${productId}/stock-notify/status?email=${q}`;
      const res = isAuthenticated
        ? await authFetch(path)
        : await fetch(`${API_URL}${path}`, { credentials: "include" });
      if (!res.ok) return false;
      const data = (await res.json()) as { subscribed?: boolean };
      return data.subscribed === true;
    },
    [isAuthenticated, productId],
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    let cancelled = false;
    void fetchStatus(user.email).then((isSub) => {
      if (!cancelled && isSub) {
        setSubscribed(true);
        setActiveEmail(user.email);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchStatus, isAuthenticated, user?.email]);

  async function subscribe(overrideEmail?: string) {
    const target = (
      isAuthenticated && user?.email ? user.email : overrideEmail ?? email
    ).trim();

    if (!target) {
      setStatus("err");
      return;
    }

    setStatus("loading");
    const body = JSON.stringify({ email: target });

    try {
      const res = isAuthenticated
        ? await authFetch(`/products/${productId}/stock-notify`, {
            method: "POST",
            body,
          })
        : await fetch(`${API_URL}/products/${productId}/stock-notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body,
          });

      const data = (await res.json().catch(() => ({}))) as { duplicate?: boolean };

      if (res.ok) {
        setActiveEmail(target);
        setSubscribed(true);
        setStatus(data.duplicate ? "dup" : "ok");
        return;
      }
      setStatus("err");
    } catch {
      setStatus("err");
    }
  }

  async function unsubscribe() {
    const target = resolvedEmail;
    if (!target) {
      setStatus("err");
      return;
    }

    setStatus("loading");
    const body = JSON.stringify({ email: target });

    try {
      const res = isAuthenticated
        ? await authFetch(`/products/${productId}/stock-notify`, {
            method: "DELETE",
            body,
          })
        : await fetch(`${API_URL}/products/${productId}/stock-notify`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body,
          });

      if (res.ok) {
        setSubscribed(false);
        setStatus("unsub_ok");
        return;
      }
      setStatus("err");
    } catch {
      setStatus("err");
    }
  }

  if (status === "unsub_ok") {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-foreground/[0.06] px-4 py-3 text-[14px] font-medium text-foreground/75">
          {t("products.notify.unsubscribeSuccess")}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-[13px] font-semibold text-primary hover:text-primary-hover"
        >
          {t("products.notify.resubscribe")}
        </button>
      </div>
    );
  }

  if (subscribed) {
    const banner =
      status === "ok"
        ? t("products.notify.success")
        : status === "dup"
          ? t("products.notify.successDuplicate")
          : t("products.notify.subscribed");

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-background/40 p-4">
        <p className="rounded-lg bg-success/10 px-4 py-3 text-[14px] font-medium text-success">
          {banner}
        </p>
        {resolvedEmail && (
          <p className="text-[13px] text-foreground/65">
            {t("products.notify.subscribedAs")}{" "}
            <span className="font-medium text-foreground">{resolvedEmail}</span>
          </p>
        )}
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void unsubscribe()}
          className="inline-flex h-11 items-center justify-center self-start rounded-lg border border-foreground/15 bg-white px-4 text-[14px] font-semibold text-foreground transition hover:border-error/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" aria-hidden />
          ) : (
            t("products.notify.unsubscribe")
          )}
        </button>
        {status === "err" && (
          <p className="text-[13px] font-medium text-error" role="alert">
            {t("products.notify.unsubscribeError")}
          </p>
        )}
      </div>
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
          onClick={() => void subscribe()}
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
          onClick={() => void subscribe()}
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
