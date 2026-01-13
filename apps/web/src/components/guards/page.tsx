"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";

export default function BackofficePage() {
  const { user } = useAuth();

  return (
    <AuthGuard requiredRole="admin">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Tableau de Bord Backoffice</h1>
          <p className="text-sm text-slate-600">
            Bienvenue dans l'interface d'administration.
          </p>
        </div>
        <div className="card p-6 space-y-3">
          {user ? (
            <p className="text-slate-700">Connecté en tant que: {user.email} (Rôle: {user.role})</p>
          ) : (
            <p className="text-slate-700">Chargement des informations de l'utilisateur...</p>
          )}
          {/* Ici, les autres membres de l'équipe pourront ajouter les fonctionnalités du BO */}
        </div>
      </div>
    </AuthGuard>
  );
}