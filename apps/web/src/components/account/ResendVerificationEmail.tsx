"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useT } from "@/context/LocaleContext";

export function ResendVerificationEmail({
  email,
  className = "",
}: {
  email: string;
  className?: string;
}) {
  const t = useT();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function resend() {
    const to = email.trim();
    if (!to) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className={className}>
      <p className="text-[13px] text-foreground/75">{t("auth.resend.hint")}</p>
      <button
        type="button"
        disabled={status === "loading" || !email.trim()}
        onClick={() => void resend()}
        className="mt-2 text-[13px] font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
      >
        {status === "loading" ? t("auth.resend.sending") : t("auth.resend.button")}
      </button>
      {status === "ok" && (
        <p className="mt-2 text-[13px] font-medium text-success" role="status">
          {t("auth.resend.sent")}
        </p>
      )}
      {status === "err" && (
        <p className="mt-2 text-[13px] font-medium text-error" role="alert">
          {t("auth.resend.failed")}
        </p>
      )}
    </div>
  );
}
