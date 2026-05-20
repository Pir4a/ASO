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

  // CDC §XVI.10 — admins must have MFA enrolled to reach the backoffice.
  // Computed here (not just in the effect) so the render branch can hide the
  // children while the redirect is in flight.
  const adminMissingMfa =
    requiredRole === "admin" &&
    user?.role === "admin" &&
    user?.mfaEnabled !== true;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (requiredRole && user?.role !== requiredRole) {
      // Logged in but wrong role: bounce to home.
      router.push("/");
      return;
    }
    if (adminMissingMfa) {
      // Logged in as admin but MFA not enrolled: send to the profile page,
      // pre-targeted on the security section with an explanation banner.
      router.push("/profile?reason=admin_mfa_required");
    }
  }, [isAuthenticated, loading, router, requiredRole, user, adminMissingMfa]);

  if (
    loading ||
    !isAuthenticated ||
    (requiredRole && user?.role !== requiredRole) ||
    adminMissingMfa
  ) {
    return null;
  }
  return <>{children}</>;
}