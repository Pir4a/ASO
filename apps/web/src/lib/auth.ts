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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const all = document.cookie ? document.cookie.split(";") : [];
  for (const item of all) {
    const [k, ...v] = item.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

/**
 * Authenticated fetch: attaches Bearer token from localStorage and
 * triggers an automatic logout-and-redirect on 401 responses.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();

  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const method = (init.method ?? "GET").toUpperCase();
  if (!isSafeMethod(method)) {
    const csrfToken = getCookie("XSRF-TOKEN");
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  const url = input.startsWith("http") ? input : `${API_URL}${input.startsWith("/") ? "" : "/"}${input}`;

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    handleUnauthorized();
  }

  return res;
}
