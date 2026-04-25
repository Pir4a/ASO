"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isTokenExpired } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
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
    // Récupérer la session au chargement (localStorage pour MVP)
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        if (isTokenExpired(storedToken)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Erreur lors de la lecture des données utilisateur du localStorage", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
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
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const updateUser = (partial: Partial<User>) => {
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
  };

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
