"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import {
  addToCart,
  downloadOrderInvoice,
  getOrder,
  type OrderDTO,
  type OrderStatus,
} from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/context/LocaleContext";

const LOCALE_TO_INTL = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar",
  he: "he",
} as const;

function statusTone(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-success/10 text-success";
    case "cancelled":
      return "bg-error/10 text-error";
    case "shipped":
      return "bg-foreground/10 text-foreground";
    default:
      return "bg-primary/10 text-primary";
  }
}

function formatDate(iso: string | Date | undefined, localeCode: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(localeCode, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function formatPrice(value: number, currency: string, localeCode: string) {
  return new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function brandLabel(b?: string) {
  if (!b) return "Carte";
  return b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = useLocale();
  const copy = ORDER_DETAIL_COPY[locale];
  const localeCode = LOCALE_TO_INTL[locale];
  const statusLabels = copy.statusLabels as Record<OrderStatus, string>;
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshCart } = useCart();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getOrder(id);
        if (!cancelled) setOrder(result);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : copy.unexpectedError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      await downloadOrderInvoice(order.id);
    } catch (e) {
      setInvoiceError(
        e instanceof Error ? e.message : copy.invoiceDownloadError,
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!order || reorderLoading) return;
    setReorderError(null);
    setReorderLoading(true);
    try {
      // Re-add every line to the active cart, then redirect.
      for (const item of order.items ?? []) {
        await addToCart(item.productId, item.quantity);
      }
      await refreshCart();
      router.push("/cart");
    } catch (e) {
      setReorderError(
        e instanceof Error
          ? e.message
          : copy.reorderError,
      );
      setReorderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Breadcrumb here={copy.order} copy={copy} />
        <div className="rounded-2xl border border-error/30 bg-error/10 px-6 py-12 text-center text-error">
          {error ?? copy.notFound}
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber ?? "—";
  const billing = order.billingAddress ?? order.shippingAddress;

  return (
    <div className="space-y-6">
      <Breadcrumb here={orderNumber} copy={copy} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
            {copy.order}
          </p>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
            {orderNumber}
          </h1>
          <p className="mt-1 text-[13px] text-foreground/60">
            {copy.placedOn} {formatDate(order.createdAt, localeCode)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${statusTone(order.status)}`}
          >
            <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabels[order.status] ?? order.status}
          </span>
          <button
            type="button"
            onClick={handleReorder}
            disabled={reorderLoading || (order.items ?? []).length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[12.5px] font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            title={copy.reorderTitle}
          >
            {reorderLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {copy.adding}
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                  <path d="M3 8a5 5 0 1 0 1.5-3.5L3 6m0 0V3m0 3h3" />
                </svg>
                {copy.reorder}
              </>
            )}
          </button>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-white px-3 py-2 text-[12.5px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
              <path d="M13 8H3m3-3-3 3 3 3" />
            </svg>
            {copy.allOrders}
          </Link>
        </div>
      </header>
      {reorderError && (
        <div
          role="alert"
          className="rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-[12.5px] text-error"
        >
          {reorderError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_minmax(0,1fr)]">
        {/* ── Items ──────────────────────────────────────── */}
        <div className="space-y-5">
          <SectionCard
            eyebrow={copy.products}
            title={copy.orderedItems}
            hint={copy.orderedItemsHint}
          >
            <ul className="divide-y divide-foreground/5" role="list">
              {(order.items ?? []).map((item) => {
                const unit = Number(item.price);
                const lineTotal = unit * item.quantity;
                return (
                  <li
                    key={item.id}
                    className="grid items-baseline gap-2 py-4 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-[15px] font-semibold text-foreground">
                        {item.productName}
                      </p>
                      {item.productSku && (
                        <p className="mt-0.5 font-mono text-[11px] text-foreground/55">
                          {copy.skuPrefix} {item.productSku}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[13px] text-foreground/65 sm:min-w-[140px]">
                      <p className="tabular-nums">
                        {formatPrice(unit, item.currency, localeCode)}
                      </p>
                      <p className="text-[11.5px] tabular-nums">×&nbsp;{item.quantity}</p>
                    </div>
                    <p className="text-right font-heading text-[15px] font-bold tabular-nums text-foreground sm:min-w-[120px]">
                      {formatPrice(lineTotal, item.currency, localeCode)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-foreground/10 pt-4">
              <span className="font-heading text-[14px] font-semibold text-foreground">
                {copy.totalInclTax}
              </span>
              <span className="font-heading text-[22px] font-bold tabular-nums text-foreground">
                {formatPrice(Number(order.total), order.currency, localeCode)}
              </span>
            </div>
          </SectionCard>

          {/* ── Invoice ─────────────────────────────────── */}
          <SectionCard
            eyebrow={copy.invoice}
            title={copy.pdfDocument}
            hint={copy.invoiceHint}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[13px] text-foreground/65">
                {copy.invoiceMeta}
              </div>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={invoiceLoading}
                style={{ color: "#fff" }}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[13.5px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invoiceLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {copy.generating}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M8 2v8m0 0 3-3m-3 3-3-3M3 13h10" />
                    </svg>
                    {copy.downloadInvoice}
                  </>
                )}
              </button>
            </div>
            {invoiceError && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[12.5px] text-error">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="m4.5 4.5 7 7" />
                </svg>
                {invoiceError}
              </p>
            )}
          </SectionCard>
        </div>

        {/* ── Summary sidebar ─────────────────────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-44">
          {/* Payment */}
          <SectionCard eyebrow={copy.payment} title={copy.methodUsed}>
            {order.paymentLast4 ? (
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-14 place-items-center rounded-lg bg-foreground text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{ color: "#fff" }}
                >
                  {brandLabel(order.paymentBrand).slice(0, 4)}
                </span>
                <div>
                  <p className="font-heading text-[14px] font-semibold text-foreground">
                    {brandLabel(order.paymentBrand)}{" "}
                    <span className="font-mono text-foreground/65">
                      •••• {order.paymentLast4}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-foreground/60">
                    {copy.statusLabel} ·{" "}
                    {order.paymentStatus === "paid"
                      ? copy.paid
                      : (order.paymentStatus ?? "—")}
                  </p>
                </div>
              </div>
            ) : order.paymentMethod === "stripe" ? (
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-14 place-items-center rounded-lg bg-foreground text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{ color: "#fff" }}
                >
                  CB
                </span>
                <div>
                  <p className="font-heading text-[14px] font-semibold text-foreground">
                    {copy.card}
                    <span className="ml-1 text-[11.5px] font-normal text-foreground/55">
                      (Stripe)
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-foreground/60">
                    {copy.statusLabel} ·{" "}
                    {order.paymentStatus === "paid"
                      ? copy.paid
                      : (order.paymentStatus ?? "—")}
                    {" · "}
                    {copy.cardDetailsNotCaptured}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-foreground/60">
                {copy.paymentInfoUnavailable}
              </p>
            )}
          </SectionCard>

          {/* Billing */}
          <SectionCard
            eyebrow={copy.address}
            title={copy.billingShipping}
          >
            {billing ? (
              <address className="not-italic space-y-0.5 text-[13.5px] text-foreground">
                {(billing.firstName || billing.lastName) && (
                  <p className="font-heading font-semibold">
                    {[billing.firstName, billing.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
                {billing.street && <p>{billing.street}</p>}
                {billing.address2 && <p className="text-foreground/65">{billing.address2}</p>}
                {(billing.postalCode || billing.city) && (
                  <p>
                    <span className="tabular-nums">{billing.postalCode}</span>{" "}
                    {billing.city}
                    {billing.region ? `, ${billing.region}` : ""}
                  </p>
                )}
                {billing.country && <p className="text-foreground/65">{billing.country}</p>}
                {billing.phone && (
                  <p className="mt-1.5 text-[12px] text-foreground/60">
                    {billing.phone}
                  </p>
                )}
              </address>
            ) : (
              <p className="text-[13px] text-foreground/60">
                {copy.noAddress}
              </p>
            )}
          </SectionCard>

          {/* Status timeline */}
          {(order.statusHistory ?? []).length > 0 && (
            <SectionCard eyebrow={copy.tracking} title={copy.history}>
              <ol className="space-y-2.5" role="list">
                {(order.statusHistory ?? []).map((h, i) => (
                  <li key={`${h.status}-${i}`} className="flex items-start gap-3 text-[12.5px]">
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-2 w-2 flex-none rounded-full bg-primary"
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {statusLabels[h.status] ?? h.status}
                      </p>
                      <p className="text-[11px] text-foreground/55">
                        {new Date(h.at).toLocaleString(localeCode)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function Breadcrumb({
  here,
  copy,
}: {
  here: string;
  copy: (typeof ORDER_DETAIL_COPY)[keyof typeof ORDER_DETAIL_COPY];
}) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
    >
      <Link href="/" className="hover:text-primary">
        {copy.home}
      </Link>
      <span aria-hidden="true" className="text-foreground/25">/</span>
      <Link href="/orders" className="hover:text-primary">
        {copy.myOrders}
      </Link>
      <span aria-hidden="true" className="text-foreground/25">/</span>
      <span className="font-semibold text-foreground">{here}</span>
    </nav>
  );
}

function SectionCard({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      <header className="border-b border-foreground/5 px-6 py-5">
        <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h2 className="font-heading text-[18px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <p className="mt-1 text-[13px] text-foreground/60">{hint}</p>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

const ORDER_DETAIL_COPY = {
  fr: {
    home: "Accueil",
    myOrders: "Mes commandes",
    order: "Commande",
    placedOn: "Passée le",
    unexpectedError: "Erreur inattendue.",
    invoiceDownloadError: "Impossible de télécharger la facture.",
    reorderError: "Impossible d'ajouter les articles au panier.",
    notFound: "Commande introuvable.",
    reorderTitle: "Re-ajouter les articles dans le panier",
    adding: "Ajout en cours…",
    reorder: "Renouveler la commande",
    allOrders: "Toutes mes commandes",
    products: "Produits",
    orderedItems: "Articles commandés",
    orderedItemsHint: "Récapitulatif détaillé des lignes facturées.",
    skuPrefix: "Réf.",
    totalInclTax: "Total TTC",
    invoice: "Facture",
    pdfDocument: "Document PDF",
    invoiceHint: "Téléchargez votre facture pour vos archives comptables.",
    invoiceMeta: "Format A4 · branding Althea Systems · TVA détaillée.",
    generating: "Génération…",
    downloadInvoice: "Télécharger la facture (PDF)",
    payment: "Paiement",
    methodUsed: "Méthode utilisée",
    statusLabel: "Statut",
    paid: "Payée",
    card: "Carte bancaire",
    cardDetailsNotCaptured: "Détails de la carte non capturés",
    paymentInfoUnavailable: "Information de paiement indisponible.",
    address: "Adresse",
    billingShipping: "Facturation et livraison",
    noAddress: "Aucune adresse enregistrée.",
    tracking: "Suivi",
    history: "Historique",
    statusLabels: {
      pending: "En attente",
      processing: "En traitement",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
    },
  },
  en: {
    home: "Home",
    myOrders: "My orders",
    order: "Order",
    placedOn: "Placed on",
    unexpectedError: "Unexpected error.",
    invoiceDownloadError: "Could not download invoice.",
    reorderError: "Could not add items to cart.",
    notFound: "Order not found.",
    reorderTitle: "Add these items back to cart",
    adding: "Adding…",
    reorder: "Reorder",
    allOrders: "All my orders",
    products: "Products",
    orderedItems: "Ordered items",
    orderedItemsHint: "Detailed summary of billed lines.",
    skuPrefix: "SKU",
    totalInclTax: "Total (incl. VAT)",
    invoice: "Invoice",
    pdfDocument: "PDF document",
    invoiceHint: "Download your invoice for accounting records.",
    invoiceMeta: "A4 format · Althea Systems branding · detailed VAT.",
    generating: "Generating…",
    downloadInvoice: "Download invoice (PDF)",
    payment: "Payment",
    methodUsed: "Method used",
    statusLabel: "Status",
    paid: "Paid",
    card: "Card",
    cardDetailsNotCaptured: "Card details were not captured",
    paymentInfoUnavailable: "Payment information unavailable.",
    address: "Address",
    billingShipping: "Billing and shipping",
    noAddress: "No address saved.",
    tracking: "Tracking",
    history: "History",
    statusLabels: {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
  },
  ar: {
    home: "الرئيسية",
    myOrders: "طلباتي",
    order: "الطلب",
    placedOn: "تم الطلب في",
    unexpectedError: "حدث خطأ غير متوقع.",
    invoiceDownloadError: "تعذّر تنزيل الفاتورة.",
    reorderError: "تعذّر إضافة المنتجات إلى السلة.",
    notFound: "لم يتم العثور على الطلب.",
    reorderTitle: "إعادة إضافة المنتجات إلى السلة",
    adding: "جارٍ الإضافة…",
    reorder: "إعادة الطلب",
    allOrders: "كل طلباتي",
    products: "المنتجات",
    orderedItems: "المنتجات المطلوبة",
    orderedItemsHint: "ملخص تفصيلي للعناصر المفوترة.",
    skuPrefix: "SKU",
    totalInclTax: "الإجمالي شامل الضريبة",
    invoice: "الفاتورة",
    pdfDocument: "مستند PDF",
    invoiceHint: "نزّل الفاتورة لأرشيفك المحاسبي.",
    invoiceMeta: "صيغة A4 · هوية Althea Systems · ضريبة مفصلة.",
    generating: "جارٍ الإنشاء…",
    downloadInvoice: "تنزيل الفاتورة (PDF)",
    payment: "الدفع",
    methodUsed: "الطريقة المستخدمة",
    statusLabel: "الحالة",
    paid: "مدفوع",
    card: "بطاقة",
    cardDetailsNotCaptured: "لم يتم حفظ تفاصيل البطاقة",
    paymentInfoUnavailable: "معلومات الدفع غير متاحة.",
    address: "العنوان",
    billingShipping: "الفوترة والشحن",
    noAddress: "لا يوجد عنوان محفوظ.",
    tracking: "التتبع",
    history: "السجل",
    statusLabels: {
      pending: "قيد الانتظار",
      processing: "قيد المعالجة",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغى",
    },
  },
  he: {
    home: "דף הבית",
    myOrders: "ההזמנות שלי",
    order: "הזמנה",
    placedOn: "בוצעה בתאריך",
    unexpectedError: "אירעה שגיאה בלתי צפויה.",
    invoiceDownloadError: "לא ניתן להוריד חשבונית.",
    reorderError: "לא ניתן להוסיף את הפריטים לעגלה.",
    notFound: "הזמנה לא נמצאה.",
    reorderTitle: "הוסף מחדש את הפריטים לעגלה",
    adding: "מוסיף…",
    reorder: "הזמנה חוזרת",
    allOrders: "כל ההזמנות שלי",
    products: "מוצרים",
    orderedItems: "פריטים שהוזמנו",
    orderedItemsHint: "סיכום מפורט של שורות החיוב.",
    skuPrefix: "SKU",
    totalInclTax: "סה\"כ כולל מע\"מ",
    invoice: "חשבונית",
    pdfDocument: "מסמך PDF",
    invoiceHint: "הורד את החשבונית לרישומי הנהלת חשבונות.",
    invoiceMeta: "פורמט A4 · מיתוג Althea Systems · מע\"מ מפורט.",
    generating: "מייצר…",
    downloadInvoice: "הורדת חשבונית (PDF)",
    payment: "תשלום",
    methodUsed: "שיטה בשימוש",
    statusLabel: "סטטוס",
    paid: "שולם",
    card: "כרטיס",
    cardDetailsNotCaptured: "פרטי הכרטיס לא נשמרו",
    paymentInfoUnavailable: "פרטי תשלום אינם זמינים.",
    address: "כתובת",
    billingShipping: "חיוב ומשלוח",
    noAddress: "אין כתובת שמורה.",
    tracking: "מעקב",
    history: "היסטוריה",
    statusLabels: {
      pending: "ממתין",
      processing: "בטיפול",
      shipped: "נשלח",
      delivered: "נמסר",
      cancelled: "בוטל",
    },
  },
} as const;
