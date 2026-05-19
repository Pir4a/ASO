"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { csrfHeader, isTokenExpired } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  pendingEmail?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        try {
          if (!isTokenExpired(storedToken)) {
            if (!cancelled) {
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
            }
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erreur lors de la lecture des données utilisateur du localStorage", error);
        }
      }
      // Stored token missing or expired — try the refresh cookie before
      // treating the user as logged out. (#37 — silent re-auth.)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: csrfHeader(),
        });
        if (res.ok) {
          const data = (await res.json()) as { access_token?: string; user?: User };
          if (data.access_token && data.user) {
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            if (!cancelled) {
              setToken(data.access_token);
              setUser(data.user);
            }
            setLoading(false);
            return;
          }
        }
      } catch {
        /* offline — fall through to logged-out state */
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setLoading(false);
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    // Merge any guest cart into the freshly-authenticated user's cart, if one exists.
    const guestCartId = localStorage.getItem("guestCartId");
    if (guestCartId) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      try {
        await fetch(`${API_URL}/cart/merge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({ guestCartId }),
        });
      } catch (err) {
        console.warn("Failed to merge guest cart:", err);
      } finally {
        localStorage.removeItem("guestCartId");
      }
    }
  };

  const logout = () => {
    // #37 — best-effort revoke on the server so the refresh cookie + DB hash
    // are cleared. We don't await because the navigation below would race it.
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    void fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: csrfHeader(),
    }).catch(() => {
      /* offline / network error: cookie still expires server-side eventually */
    });
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Must be stable: consumers (e.g. /profile) put updateUser in useEffect
  // deps. A fresh ref on each render would re-fire the effect → /profile/me
  // → updateUser → re-render → loop → 429 (same class of bug as #42 on /orders).
  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem("user", JSON.stringify(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
