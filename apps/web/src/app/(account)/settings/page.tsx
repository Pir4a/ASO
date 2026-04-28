"use client";

import { useT } from "@/context/LocaleContext";

export default function SettingsPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("account.settings")}</h1>
        <p className="text-sm text-foreground/70">
          {t("account.settingsSubtitle")}
        </p>
      </div>
      <form className="card space-y-3 p-6">
        <label className="flex items-center justify-between text-sm text-foreground/80">
          <span>{t("products.status.low_stock")}</span>
          <input type="checkbox" defaultChecked className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between text-sm text-foreground/80">
          <span>{t("header.products")}</span>
          <input type="checkbox" className="h-4 w-4" />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
          {t("search.apply")}
        </button>
      </form>
    </div>
  );
}

