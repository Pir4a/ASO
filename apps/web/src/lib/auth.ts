"use client";

import { API_URL } from "./api";

type JwtPayload = { exp?: number; sub?: string; email?: string; role?: string };

function base64UrlDecode(str: string): string {
  const pad = 4 - (str.length % 4);
  const padded = pad < 4 ? str + "=".repeat(pad) : str;
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= Date.now();
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearSession();
    return null;
  }
  return token;
}

export function handleUnauthorized(redirect = true) {
  if (typeof window === "undefined") return;
  clearSession();
  if (!redirect) return;
  const path = window.location.pathname;
  if (path === "/login" || path === "/signup") return;
  const next = encodeURIComponent(path + window.location.search);
  window.location.href = `/login?message=${encodeURIComponent("Session expirée, veuillez vous reconnecter.")}&redirect=${next}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const all = document.cookie ? document.cookie.split(";") : [];
  for (const item of all) {
    const [k, ...v] = item.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Build the CSRF header to send alongside cookie-auth requests
    (/auth/refresh and /auth/logout). Returns an empty object if no
    XSRF-TOKEN cookie is set yet — the guard will then short-circuit
    because there is no refresh cookie to protect either. */
export function csrfHeader(): Record<string, string> {
  const token = getCookie("XSRF-TOKEN");
  return token ? { "x-csrf-token": token } : {};
}

/** #37 — exchange the httpOnly refresh cookie for a fresh access token.
    Returns the new token (also stored in localStorage), or null on failure. */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // De-duplicate concurrent refresh attempts so a burst of 401s only triggers
  // one /auth/refresh call.
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeader(),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string; user?: unknown };
      if (!data.access_token) return null;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      }
      return data.access_token;
    } catch {
      return null;
    } finally {
      // Allow the next 401 to trigger another refresh after this one settles.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();
  return refreshInFlight;
}

/**
 * Authenticated fetch: attaches Bearer token from localStorage, sends the
 * httpOnly refresh cookie, and on 401 transparently exchanges the cookie
 * for a fresh access token before retrying once.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = input.startsWith("http") ? input : `${API_URL}${input.startsWith("/") ? "" : "/"}${input}`;

  const buildHeaders = (token: string | null) => {
    const h = new Headers(init.headers ?? {});
    if (token) h.set("Authorization", `Bearer ${token}`);
    if (init.body && !h.has("Content-Type")) h.set("Content-Type", "application/json");
    return h;
  };

  // Send the refresh cookie alongside every authed call so the server can
  // recognise the session even if the access token has just expired.
  const baseInit: RequestInit = { ...init, credentials: "include" };

  const initialToken = getStoredToken();
  const res = await fetch(url, { ...baseInit, headers: buildHeaders(initialToken) });

  // /auth/refresh itself calls fetch directly; never recurse from there.
  const isRefreshCall = url.endsWith("/auth/refresh");

  if (res.status === 401 && !isRefreshCall) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retry = await fetch(url, { ...baseInit, headers: buildHeaders(newToken) });
      if (retry.status === 401) handleUnauthorized();
      return retry;
    }
    handleUnauthorized();
  }

  return res;
}
