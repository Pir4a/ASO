"use client";
import React from 'react';

interface UserAdminPanelProps {
  userId: string;
}

export default function UserAdminPanel({ userId }: UserAdminPanelProps) {
  const executeAction = async (endpoint: string, method: string, body?: any) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      if (response.ok) alert("Action Admin validée");
    } catch (error) {
      console.error("Erreur API:", error);
    }
  };

  return (
    <div className="card space-y-4 p-6 border border-slate-200 bg-white rounded-md shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Actions Administrateur (ID: {userId})</h2>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button 
          onClick={() => executeAction(`${userId}/reset-password`, 'PATCH')}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          Réinitialiser MDP
        </button>

        <button 
          onClick={() => executeAction(`${userId}/status`, 'PATCH', { active: false })}
          className="rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          Désactiver Compte
        </button>

        <button 
          onClick={() => executeAction(userId, 'DELETE')}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
        >
          Suppression RGPD
        </button>

        <button 
          onClick={() => executeAction('email', 'POST', { to: "user@example.com", subject: "Support ASO", content: "Message admin" })}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
        >
          Envoyer Email manuel
        </button>
      </div>
    </div>
  );
}