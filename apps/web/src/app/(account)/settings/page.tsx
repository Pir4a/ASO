"use client";

import { useLocale } from "@/context/LocaleContext";

export default function SettingsPage() {
  const locale = useLocale();
  const copy = SETTINGS_COPY[locale];

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{copy.title}</h1>
        <p className="text-sm text-foreground/70">
          {copy.subtitle}
        </p>
      </div>
      <form className="card space-y-3 p-6">
        <label className="flex items-center justify-between text-sm text-foreground/80">
          <span>{copy.lowStockNotifications}</span>
          <input type="checkbox" defaultChecked className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between text-sm text-foreground/80">
          <span>{copy.productUpdates}</span>
          <input type="checkbox" className="h-4 w-4" />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
          {copy.save}
        </button>
      </form>
    </div>
  );
}

const SETTINGS_COPY = {
  fr: {
    title: "Paramètres",
    subtitle: "Préférences de langue, alertes stock, consentement cookies.",
    lowStockNotifications: "Notifications stock faible",
    productUpdates: "Recevoir les mises à jour produits",
    save: "Enregistrer (mock)",
  },
  en: {
    title: "Settings",
    subtitle: "Language preferences, low-stock alerts, cookie consent.",
    lowStockNotifications: "Low-stock notifications",
    productUpdates: "Receive product updates",
    save: "Save (mock)",
  },
  ar: {
    title: "الإعدادات",
    subtitle: "تفضيلات اللغة، تنبيهات انخفاض المخزون، وموافقة ملفات تعريف الارتباط.",
    lowStockNotifications: "تنبيهات انخفاض المخزون",
    productUpdates: "استلام تحديثات المنتجات",
    save: "حفظ (تجريبي)",
  },
  he: {
    title: "הגדרות",
    subtitle: "העדפות שפה, התראות מלאי נמוך, והסכמת עוגיות.",
    lowStockNotifications: "התראות מלאי נמוך",
    productUpdates: "לקבל עדכוני מוצרים",
    save: "שמירה (דמו)",
  },
} as const;

