"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "customer";
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  ordersCount?: number;
  totalSpent?: number;
}

export default function BackofficeUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      if (!token) return;
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (status) params.set("status", status);

      const res = await fetch(`${API_URL}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    }
    load();
  }, [token, search, role, status]);

  async function toggleStatus(user: AdminUser) {
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !(user.isActive ?? true) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(item => (item.id === updated.id ? { ...item, ...updated } : item)));
    }
  }

  async function changeRole(user: AdminUser, nextRole: "admin" | "customer") {
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/users/${user.id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(item => (item.id === updated.id ? { ...item, ...updated } : item)));
    }
  }

  async function resetPassword(user: AdminUser) {
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/users/${user.id}/reset-password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Mot de passe temporaire: ${data.tempPassword}`);
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Utilisateurs (backoffice)</h1>
          <p className="text-sm text-slate-600">
            Filtrez, activez/desactivez les comptes et reinitialisez les mots de passe.
          </p>
        </div>

        <div className="card grid gap-3 p-6 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Recherche nom/email"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="">Tous les roles</option>
            <option value="customer">Client</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="pending">Email non verifie</option>
          </select>
        </div>

        <div className="card space-y-3 p-6">
          {users.map(user => {
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
            return (
              <div key={user.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <p className="text-xs text-slate-500">
                    Commandes: {user.ordersCount ?? 0} • CA: {user.totalSpent?.toFixed(2) || "0.00"}€
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(user)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                  >
                    {user.isActive === false ? "Activer" : "Desactiver"}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeRole(user, user.role === "admin" ? "customer" : "admin")}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                  >
                    Passer {user.role === "admin" ? "client" : "admin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetPassword(user)}
                    className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:border-amber-400"
                  >
                    Reset password
                  </button>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <p className="text-sm text-slate-500">Aucun utilisateur.</p>}
        </div>
      </div>
    </AuthGuard>
  );
}
