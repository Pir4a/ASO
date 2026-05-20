"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { parseApiError } from "@/lib/api-error";
import { ResendVerificationEmail } from "@/components/account/ResendVerificationEmail";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LocaleContext";

type VerifyErrorKind = "expired" | "invalid" | "generic";

/** Where verified users land. Storefront "dashboard" is /profile, matching
    the /account hub's primary CTA. */
const POST_VERIFY_REDIRECT = "/profile";

function VerifyContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailHint = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorKind, setErrorKind] = useState<VerifyErrorKind>("generic");
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorKind("invalid");
      return;
    }

    const verify = async () => {
      try {
        // credentials: 'include' so the API can Set-Cookie the refresh token
        // on the auth cookie scope (matches /login).
        const res = await fetch(
          `${API_URL}/auth/verify?token=${encodeURIComponent(token)}`,
          { credentials: "include" },
        );
        if (!res.ok) {
          const parsed = parseApiError(await res.json().catch(() => ({})));
          if (parsed.code === "VERIFY_EMAIL_TOKEN_EXPIRED") {
            setErrorKind("expired");
          } else if (parsed.code === "VERIFY_EMAIL_TOKEN_INVALID") {
            setErrorKind("invalid");
          } else {
            setErrorKind("generic");
          }
          throw new Error("Verification failed");
        }
        const data = (await res.json().catch(() => ({}))) as {
          verified?: boolean;
          mfaRequired?: boolean;
          email?: string;
          access_token?: string;
          user?: {
            id: string;
            email: string;
            role: string;
            firstName?: string;
            lastName?: string;
          };
        };
        setStatus("success");

        // MFA-enabled account: don't auto-login. Send the user to /login with
        // the email pre-filled and a return_to hint to the dashboard.
        if (data.mfaRequired) {
          const params = new URLSearchParams();
          if (data.email) params.set("email", data.email);
          params.set("return_to", POST_VERIFY_REDIRECT);
          params.set("message", t("auth.verify.loginReady"));
          router.replace(`/login?${params.toString()}`);
          return;
        }

        if (data.access_token && data.user) {
          await login(data.access_token, data.user);
          router.replace(POST_VERIFY_REDIRECT);
          return;
        }

        // Defensive fallback: server didn't issue a token (legacy or
        // unexpected payload). Send the user to /login the old way rather
        // than getting stuck on the success screen.
        router.replace(
          `/login?message=${encodeURIComponent(t("auth.verify.loginReady"))}`,
        );
      } catch {
        setStatus("error");
      }
    };

    void verify();
  }, [token, router, t, login]);

  if (status === "loading") {
    return (
      <div className="space-y-4 p-8 text-center">
        <h2 className="text-xl font-semibold">{t("auth.verify.loading")}</h2>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-success">{t("auth.verify.successTitle")}</h2>
        <p className="text-foreground/70">{t("auth.verify.signingIn")}</p>
        <div
          aria-hidden="true"
          className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
        <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-error">{t("auth.verify.errorTitle")}</h2>
      <p className="text-foreground/70">
        {errorKind === "expired"
          ? t("auth.verify.errorExpired")
          : errorKind === "invalid"
            ? t("auth.verify.errorInvalid")
            : t("auth.verify.errorGeneric")}
      </p>
      {emailHint ? (
        <div className="mx-auto max-w-sm rounded-lg border border-foreground/10 bg-background/40 px-4 py-3 text-start">
          <ResendVerificationEmail email={emailHint} />
        </div>
      ) : errorKind === "expired" ? (
        <Link href="/login" className="inline-block text-sm font-semibold text-primary hover:underline">
          {t("auth.verify.loginNow")}
        </Link>
      ) : null}
      <Link href="/signup" className="inline-block text-primary hover:underline">
        {t("auth.verify.backSignup")}
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  const t = useT();
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">{t("common.loading")}</div>}>
      <VerifyContent />
    </Suspense>
  );
}
