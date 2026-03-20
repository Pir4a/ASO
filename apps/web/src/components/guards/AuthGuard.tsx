"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    } else if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Rediriger si l'utilisateur est connecté mais n'a pas le rôle requis
      router.push("/"); // Ou une page d'accès refusé
    }
  }, [isAuthenticated, loading, router, requiredRole, user]);

  if (loading || !isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null; // Ou un loader, si tu veux afficher quelque chose pendant la redirection
  }
  return <>{children}</>;
}