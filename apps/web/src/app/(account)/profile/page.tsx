"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-md space-y-4">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Mon Profil</h1>
          <p className="text-sm text-slate-600">
            Bienvenue sur votre page de profil.
          </p>
        </div>
        <div className="card p-6 space-y-3">
          {user ? (
            <p className="text-slate-700">Email: {user.email}</p>
          ) : (
            <p className="text-slate-700">Chargement des informations de l'utilisateur...</p>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
