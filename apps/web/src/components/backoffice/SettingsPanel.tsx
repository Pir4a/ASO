"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel, Icon } from "./DashboardUI";
import { authFetch } from "@/lib/auth";

type SettingsPayload = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  timezone: string;
  defaultCurrency: string;
  defaultVatRate: number;
  lowStockThreshold: number;
  allowGuestCheckout: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const DEFAULT_SETTINGS: SettingsPayload = {
  storeName: "Althea Systems",
  supportEmail: "",
  supportPhone: "",
  supportAddress: "",
  timezone: "Europe/Paris",
  defaultCurrency: "EUR",
  defaultVatRate: 20,
  lowStockThreshold: 5,
  allowGuestCheckout: true,
  maintenanceMode: false,
  maintenanceMessage: "",
};

const inputCls =
  "w-full rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

interface SettingsPanelProps {
  userEmail?: string | null;
  userRole?: string | null;
  flash: (kind: "success" | "error", text: string) => void;
}

export function SettingsPanel({ userEmail, userRole, flash }: SettingsPanelProps) {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/content/admin/settings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        id: string | null;
        payload?: Partial<SettingsPayload>;
      };
      setSettingsId(data.id);
      setDraft({
        ...DEFAULT_SETTINGS,
        ...(data.payload ?? {}),
      });
      setDirty(false);
    } catch (e) {
      flash("error", `Impossible de charger les paramètres: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    if (!draft.storeName.trim()) {
      flash("error", "Le nom de la boutique est requis.");
      return;
    }
    if (draft.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.supportEmail)) {
      flash("error", "Email support invalide.");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/content/admin/settings`, {
        method: "PATCH",
        body: JSON.stringify({ payload: draft }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { id: string; payload?: Partial<SettingsPayload> };
      setSettingsId(data.id);
      setDraft({
        ...DEFAULT_SETTINGS,
        ...(data.payload ?? {}),
      });
      setDirty(false);
      flash("success", "Paramètres enregistrés.");
    } catch (e) {
      flash("error", `Enregistrement impossible: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bo-vstack" style={{ gap: 12 }}>
      <Panel
        title="Paramètres de l'instance"
        subtitle="Configuration globale du backoffice et de la boutique"
        actions={
          <button
            type="button"
            className="bo-btn"
            onClick={() => void load()}
            disabled={loading || saving}
          >
            <Icon.Refresh />
            Rafraîchir
          </button>
        }
      >
        {loading ? (
          <p className="bo-muted">Chargement…</p>
        ) : (
          <div className="bo-vstack" style={{ gap: 14 }}>
            <div className="bo-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div>
                <label className={labelCls}>Nom de la boutique</label>
                <input
                  className={inputCls}
                  value={draft.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  placeholder="Althea Systems"
                />
              </div>
              <div>
                <label className={labelCls}>Fuseau horaire</label>
                <input
                  className={inputCls}
                  value={draft.timezone}
                  onChange={(e) => update("timezone", e.target.value)}
                  placeholder="Europe/Paris"
                />
              </div>
              <div>
                <label className={labelCls}>Email support</label>
                <input
                  className={inputCls}
                  type="email"
                  value={draft.supportEmail}
                  onChange={(e) => update("supportEmail", e.target.value)}
                  placeholder="support@althea.local"
                />
              </div>
              <div>
                <label className={labelCls}>Téléphone support</label>
                <input
                  className={inputCls}
                  value={draft.supportPhone}
                  onChange={(e) => update("supportPhone", e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Adresse support</label>
              <textarea
                className={inputCls}
                rows={2}
                value={draft.supportAddress}
                onChange={(e) => update("supportAddress", e.target.value)}
                placeholder="Adresse complète utilisée dans les documents / support"
              />
            </div>

            <div className="bo-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div>
                <label className={labelCls}>Devise par défaut</label>
                <input
                  className={inputCls}
                  value={draft.defaultCurrency}
                  maxLength={3}
                  onChange={(e) => update("defaultCurrency", e.target.value.toUpperCase())}
                  placeholder="EUR"
                />
              </div>
              <div>
                <label className={labelCls}>TVA par défaut (%)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  max={100}
                  value={draft.defaultVatRate}
                  onChange={(e) => update("defaultVatRate", Number(e.target.value || 0))}
                />
              </div>
              <div>
                <label className={labelCls}>Seuil stock faible</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={draft.lowStockThreshold}
                  onChange={(e) => update("lowStockThreshold", Number(e.target.value || 0))}
                />
              </div>
            </div>

            <div className="bo-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <label className="bo-hstack" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.allowGuestCheckout}
                  onChange={(e) => update("allowGuestCheckout", e.target.checked)}
                />
                <span>Autoriser le checkout invité</span>
              </label>
              <label className="bo-hstack" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.maintenanceMode}
                  onChange={(e) => update("maintenanceMode", e.target.checked)}
                />
                <span>Mode maintenance global</span>
              </label>
            </div>

            <div>
              <label className={labelCls}>Message maintenance</label>
              <textarea
                className={inputCls}
                rows={2}
                value={draft.maintenanceMessage}
                onChange={(e) => update("maintenanceMessage", e.target.value)}
                placeholder="Message affiché en cas de maintenance"
              />
            </div>

            <div className="bo-hstack" style={{ justifyContent: "space-between" }}>
              <div className="bo-muted" style={{ fontSize: 11 }}>
                {settingsId ? `ID configuration: ${settingsId}` : "Configuration non encore persistée"}
              </div>
              <button type="button" className="bo-btn primary" onClick={() => void save()} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Sécurité de session" subtitle="Informations sur la session administrateur">
        <div className="bo-vstack" style={{ gap: 8 }}>
          <div>
            <div className="bo-label">Compte connecté</div>
            <div className="bo-mono">{userEmail ?? "—"}</div>
          </div>
          <div>
            <div className="bo-label">Rôle</div>
            <span className="bo-badge brand">{userRole ?? "—"}</span>
          </div>
          <div>
            <div className="bo-label">Environnement</div>
            <span className="bo-badge neutral">{process.env.NODE_ENV?.toUpperCase() ?? "UNKNOWN"}</span>
          </div>
          {dirty && <p className="bo-muted">Modifications locales non enregistrées.</p>}
        </div>
      </Panel>
    </div>
  );
}

