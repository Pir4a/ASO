"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { AddressList } from "@/components/account/AddressList";
import { PaymentMethodList } from "@/components/account/PaymentMethodList";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Mon Profil</h1>
          <p className="text-sm text-slate-600">
            Bienvenue sur votre page de profil.
          </p>
        </div>
        <div className="card p-6 space-y-3">
          {user ? (
            <div className="space-y-1">
              <p className="text-slate-900 font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          ) : (
            <p className="text-slate-700">Chargement des informations...</p>
          )}
        </div>

        <AddressList />

        <div className="card p-6">
          <PaymentMethodList />
        </div>
      </div>
    </AuthGuard>
  );
}
