"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  API_URL,
  confirmOrderPayment,
  createOrder,
  createPaymentIntent,
  createUserAddress,
  getCart,
  getUserAddresses,
  type GuestCheckoutAddress,
} from "@/lib/api";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { AddressForm, type AddressFormData } from "@/components/account/AddressForm";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useCart } from "@/hooks/useCart";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Address = AddressFormData & { id: string };
type Step = "identify" | "address" | "payment" | "confirmation";
type CartItem = {
  productId: string;
  quantity: number;
  priceCents: number;
  currency: string;
  name?: string;
};

function formatPrice(cents: number, currency = "EUR", localeCode = "fr-FR") {
  const v = cents / 100;
  return `${v >= 1000 ? v.toLocaleString(localeCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2)} ${currency}`;
}

export default function CheckoutPage() {
  const locale = useLocale();
  const copy = CHECKOUT_COPY[locale];
  const localeCode = LOCALE_TO_INTL[locale];
  const stepMeta: { key: Step; label: string }[] = [
    { key: "identify", label: copy.stepIdentify },
    { key: "address", label: copy.stepAddress },
    { key: "payment", label: copy.stepPayment },
  ];
  const { refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>(isAuthenticated ? "address" : "identify");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartVat, setCartVat] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [orderResult, setOrderResult] = useState<{
    id: string;
    orderNumber?: string;
  } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCartId, setGuestCartId] = useState<string | null>(null);
  const [guestSignupSent, setGuestSignupSent] = useState(false);

  // Read the guest cart id from localStorage once on mount (only for unauthed sessions).
  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      setGuestCartId(localStorage.getItem("guestCartId"));
    }
  }, [isAuthenticated]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // Track active step (skip identify for authed users)
  useEffect(() => {
    if (isAuthenticated && step === "identify") setStep("address");
  }, [isAuthenticated, step]);

  // Initial fetch
  useEffect(() => {
    void (async () => {
      try {
        // For guests, the cart is keyed by the x-guest-cart-id header.
        // Read straight from localStorage so we don't race the separate
        // setGuestCartId effect.
        const cartIdForFetch =
          !isAuthenticated && typeof window !== "undefined"
            ? localStorage.getItem("guestCartId") ?? undefined
            : undefined;
        const [addr, cart] = await Promise.all([
          isAuthenticated ? getUserAddresses() : Promise.resolve([]),
          getCart(cartIdForFetch),
        ]);
        setAddresses(addr);
        if (addr.length > 0) {
          setSelectedAddressId(addr[0].id);
        } else {
          // No saved addresses yet (new customer or guest) — open the form
          // straight away so the user doesn't have to click "Ajouter".
          setShowNewAddress(true);
        }
        setCartItems(cart.items as CartItem[]);
        setCartSubtotal(cart.subtotal);
        setCartVat(cart.vat);
        setCartTotal(cart.total);
        setCurrency(cart.currency);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [isAuthenticated]);

  const handleCreateAddress = async (data: AddressFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Guests can't persist addresses (no account yet) — just keep the entry
      // in memory with a synthetic id so it can be selected for this checkout.
      if (!isAuthenticated) {
        const guestAddress: Address = { ...data, id: `guest-${Date.now()}` };
        setAddresses((prev) => [...prev, guestAddress]);
        setSelectedAddressId(guestAddress.id);
        setShowNewAddress(false);
      } else {
        const created = (await createUserAddress(data)) as Address;
        setAddresses((prev) => [...prev, created]);
        setSelectedAddressId(created.id);
        setShowNewAddress(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.createAddressError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToPayment = async () => {
    if (!selectedAddressId) return;
    if (!isAuthenticated && !guestEmail.trim()) {
      setError(copy.guestEmailRequired);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let order: { id: string; orderNumber?: string };
      if (!isAuthenticated) {
        const sel = addresses.find((a) => a.id === selectedAddressId);
        if (!sel) throw new Error(copy.addressNotFound);
        const inlineAddress: GuestCheckoutAddress = {
          firstName: sel.firstName,
          lastName: sel.lastName,
          street: sel.street,
          address2: sel.address2,
          city: sel.city,
          region: sel.region,
          postalCode: sel.postalCode,
          country: sel.country,
          phone: sel.phone,
        };
        order = await createOrder({
          address: inlineAddress,
          guestCartId: guestCartId ?? undefined,
        });
      } else {
        order = await createOrder({ addressId: selectedAddressId });
      }
      setOrderResult(order);
      const intent = await createPaymentIntent(order.id, user?.id);
      setClientSecret(intent.clientSecret);
      setStep("payment");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : copy.paymentInitError,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (orderResult) {
      try {
        await confirmOrderPayment(
          orderResult.id,
          paymentId,
          !isAuthenticated
            ? { guestEmail: guestEmail.trim().toLowerCase(), guestCartId: guestCartId ?? undefined }
            : undefined,
        );
        if (!isAuthenticated) setGuestSignupSent(true);
      } catch (err) {
        console.error("Failed to finalize order:", err);
      }
    }
    await refreshCart();
    setStep("confirmation");
  };

  /* ── Confirmation screen ────────────────────────────────── */
  if (step === "confirmation" && orderResult) {
    return (
      <div className="space-y-6">
        <Breadcrumb here={copy.confirmation} />
        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white px-6 py-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/10 text-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-8 w-8">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-success">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-success" />
            {copy.orderConfirmed}
          </p>
          <h1 className="mt-2 font-heading text-[28px] font-bold tracking-tight text-foreground md:text-[32px]">
            {copy.thankYou}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[14px] text-foreground/70">
            {copy.confirmationEmail}{" "}
            <span className="font-mono font-semibold text-foreground">
              {orderResult.orderNumber ?? "—"}
            </span>.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/orders/${encodeURIComponent(orderResult.id)}`}
              style={{ color: "#fff" }}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover"
            >
              {copy.viewOrder}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M3 8h10m-3-3 3 3-3 3" />
              </svg>
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-foreground/15 bg-white px-5 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              {copy.myOrders}
            </Link>
            <Link
              href="/products"
              className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[14px] font-semibold text-foreground/65 transition hover:text-primary"
            >
              {copy.backToShop}
            </Link>
          </div>
          {guestSignupSent && (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                  <path d="M2 4h12v8H2zM2 4l6 5 6-5" />
                </svg>
                {copy.accountCreated}
              </p>
              <p className="mt-1.5 text-[13.5px] text-foreground">
                {copy.accountCreatedFor} <span className="font-semibold">{guestEmail}</span>.{" "}
                {copy.checkMailbox}
              </p>
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ── Empty cart guard ────────────────────────────────────── */
  if (cartItems.length === 0 && !orderResult) {
    return (
      <div className="space-y-6">
        <Breadcrumb here={copy.checkout} />
        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white px-6 py-16 text-center">
          <h1 className="font-heading text-[24px] font-semibold text-foreground">
            {copy.emptyCartTitle}
          </h1>
          <p className="mt-2 text-[14px] text-foreground/65">
            {copy.emptyCartBody}
          </p>
          <Link
            href="/products"
            style={{ color: "#fff" }}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover"
          >
            {copy.browseCatalog}
          </Link>
        </section>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <Breadcrumb here={copy.checkout} />

      <Stepper current={step} authenticated={isAuthenticated} onStepClick={(s) => {
        // allow going back; can't skip forward
        if (s === "identify" && !isAuthenticated) setStep("identify");
        if (s === "address") setStep("address");
      }} stepsMeta={stepMeta} />

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-[13.5px] text-error"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
            <circle cx="8" cy="8" r="6" />
            <path d="m4.5 4.5 7 7" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_minmax(0,1fr)]">
        {/* ── Left: step content ──────────────────────────── */}
        <div className="space-y-5">
          {step === "identify" && (
            <IdentifyStep
              onAuthenticated={() => setStep("address")}
              onContinueAsGuest={() => setStep("address")}
            />
          )}

          {step === "address" && (
            <SectionCard
              eyebrow={isAuthenticated ? copy.step2 : copy.step1}
              title={copy.billingShippingAddress}
              hint={copy.addressHint}
            >
              {!isAuthenticated && (
                <div className="mb-5 rounded-2xl border border-foreground/10 bg-background/40 p-4">
                  <label
                    htmlFor="checkout-guest-email"
                    className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65"
                  >
                    {copy.contactEmail}
                  </label>
                  <input
                    id="checkout-guest-email"
                    type="email"
                    required
                    placeholder={copy.emailPlaceholder}
                    autoComplete="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  <p className="mt-1.5 text-[12px] text-foreground/65">
                    {copy.emailHelp}
                  </p>
                </div>
              )}
              {addresses.length > 0 && !showNewAddress && (
                <ul className="grid gap-3 sm:grid-cols-2" role="list">
                  {addresses.map((a) => {
                    const selected = a.id === selectedAddressId;
                    const fullName = [a.firstName, a.lastName].filter(Boolean).join(" ");
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedAddressId(a.id)}
                          aria-pressed={selected}
                          className={`flex w-full flex-col gap-1 rounded-xl border bg-white px-4 py-3.5 text-left text-[13.5px] transition ${
                            selected
                              ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                              : "border-foreground/10 hover:border-primary-hover"
                          }`}
                        >
                          {fullName && (
                            <span className="font-heading font-semibold text-foreground">
                              {fullName}
                            </span>
                          )}
                          <span>{a.street}</span>
                          {a.address2 && (
                            <span className="text-foreground/65">{a.address2}</span>
                          )}
                          <span>
                            <span className="tabular-nums">{a.postalCode}</span> {a.city}
                            {a.region ? `, ${a.region}` : ""}
                          </span>
                          <span className="text-foreground/65">{a.country}</span>
                          {a.phone && (
                            <span className="text-[12px] text-foreground/60">{a.phone}</span>
                          )}
                          {selected && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-2.5 w-2.5">
                                <path d="m3 8 3.5 3.5L13 5" />
                              </svg>
                              {copy.selected}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!showNewAddress ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/15 bg-white px-4 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M8 3v10M3 8h10" />
                    </svg>
                    {copy.addAddress}
                  </button>
                  <button
                    type="button"
                    disabled={!selectedAddressId || isLoading}
                    onClick={handleGoToPayment}
                    style={{ color: "#fff" }}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? copy.initializing : copy.goToPayment}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M3 8h10m-3-3 3 3-3 3" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-foreground/10 bg-background/40 p-5">
                  <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                    {copy.newAddress}
                  </p>
                  <AddressForm
                    onSubmit={handleCreateAddress}
                    onCancel={() => setShowNewAddress(false)}
                    submitLabel={copy.saveAddress}
                  />
                </div>
              )}

              {!isAuthenticated && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-dashed border-foreground/15 bg-background/40 px-3.5 py-2 text-[12.5px] text-foreground/65">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3.5 w-3.5 text-primary">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 7v4M8 5v.01" />
                  </svg>
                  {copy.guestAddressInfo}
                </p>
              )}
            </SectionCard>
          )}

          {step === "payment" && clientSecret && (
            <SectionCard
              eyebrow={isAuthenticated ? copy.step3 : copy.step2}
              title={copy.securePayment}
              hint={copy.securePaymentHint}
            >
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <CheckoutForm
                  amount={cartTotal}
                  currency={currency}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-foreground/5 pt-4 text-[12px] text-foreground/65">
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="inline-flex items-center gap-1.5 font-semibold text-foreground/70 transition hover:text-primary"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                    <path d="M13 8H3m3-3-3 3 3 3" />
                  </svg>
                  {copy.backToAddress}
                </button>
                <span className="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5 text-primary">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {copy.secureConnectionStripe}
                </span>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right: order recap ──────────────────────────── */}
        <aside className="lg:sticky lg:top-44">
          <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
            <header className="border-b border-foreground/5 px-6 py-5">
              <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                {copy.summary}
              </p>
              <h2 className="font-heading text-[18px] font-semibold tracking-tight text-foreground">
                {copy.yourOrder}
              </h2>
            </header>
            <div className="space-y-4 px-6 py-5">
              <ul className="space-y-2.5" role="list">
                {cartItems.map((it) => (
                  <li
                    key={it.productId}
                    className="flex items-baseline justify-between gap-3 text-[13px]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {it.name ?? it.productId}
                      </span>
                      <span className="text-[11.5px] text-foreground/55 tabular-nums">
                        {formatPrice(it.priceCents, it.currency, localeCode)} × {it.quantity}
                      </span>
                    </span>
                    <span className="font-heading font-semibold tabular-nums text-foreground">
                      {formatPrice(it.priceCents * it.quantity, it.currency, localeCode)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1.5 border-t border-foreground/5 pt-4 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-foreground/65">{copy.subtotal}</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatPrice(cartSubtotal, currency, localeCode)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/65">{copy.vat}</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatPrice(cartVat, currency, localeCode)}
                  </dd>
                </div>
              </dl>

              <div className="flex items-baseline justify-between border-t border-foreground/10 pt-4">
                <span className="font-heading text-[14px] font-semibold text-foreground">
                  {copy.totalInclTax}
                </span>
                <span className="font-heading text-[20px] font-bold tabular-nums text-foreground">
                  {formatPrice(cartTotal, currency, localeCode)}
                </span>
              </div>

              {/* Address summary (visible from address step onward) */}
              {selectedAddress && step !== "identify" && (
                <div className="rounded-xl border border-foreground/10 bg-background/40 p-3.5">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/60">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3 w-3 text-primary">
                      <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5c0-2.5-2-4.5-4.5-4.5Z" />
                      <circle cx="8" cy="6" r="1.6" />
                    </svg>
                    {copy.delivery}
                  </p>
                  <p className="text-[12.5px] text-foreground/80">
                    {[selectedAddress.firstName, selectedAddress.lastName]
                      .filter(Boolean)
                      .join(" ") || copy.selectedAddress}{" "}
                    · {selectedAddress.street}
                    {selectedAddress.address2 ? `, ${selectedAddress.address2}` : ""}
                    {", "}
                    {selectedAddress.postalCode} {selectedAddress.city}
                    {selectedAddress.region ? `, ${selectedAddress.region}` : ""}
                    {", "}
                    {selectedAddress.country}
                  </p>
                </div>
              )}

              <ul className="grid grid-cols-3 gap-2 border-t border-foreground/5 pt-4 text-center text-[11px] text-foreground/65">
                <li className="flex flex-col items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4 text-primary">
                    <path d="M1 4h13v9H1V4Zm13 3h4l3 3v3h-7" />
                    <circle cx="5" cy="16" r="1.5" />
                    <circle cx="17" cy="16" r="1.5" />
                  </svg>
                  {copy.delivery48h}
                </li>
                <li className="flex flex-col items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4 text-primary">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {copy.securePaymentShort}
                </li>
                <li className="flex flex-col items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4 text-primary">
                    <path d="M12 2 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-5z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {copy.twoYearWarranty}
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function Breadcrumb({ here }: { here: string }) {
  const locale = useLocale();
  const copy = CHECKOUT_COPY[locale];
  return (
    <nav
      aria-label={copy.breadcrumb}
      className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
    >
      <Link href="/" className="hover:text-primary">
        {copy.home}
      </Link>
      <span aria-hidden="true" className="text-foreground/25">/</span>
      <Link href="/cart" className="hover:text-primary">
        {copy.cart}
      </Link>
      <span aria-hidden="true" className="text-foreground/25">/</span>
      <span className="font-semibold text-foreground">{here}</span>
    </nav>
  );
}

function Stepper({
  current,
  authenticated,
  onStepClick,
  stepsMeta,
}: {
  current: Step;
  authenticated: boolean;
  onStepClick: (s: Step) => void;
  stepsMeta: { key: Step; label: string }[];
}) {
  const steps = stepsMeta.filter((s) => (authenticated ? s.key !== "identify" : true));
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-2 overflow-x-auto rounded-xl border border-foreground/10 bg-white px-3 py-3 sm:gap-3 sm:px-5">
      {steps.map((s, i) => {
        const isCurrent = s.key === current;
        const isDone = i < currentIndex;
        const clickable = i <= currentIndex;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(s.key)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 transition sm:gap-3 sm:px-2.5 ${
                isCurrent
                  ? "bg-primary/10"
                  : isDone
                  ? "hover:bg-background/60"
                  : "cursor-default opacity-65"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[12px] font-bold ${
                  isDone
                    ? "bg-success text-white"
                    : isCurrent
                    ? "bg-primary text-white"
                    : "border border-foreground/15 bg-white text-foreground/55"
                }`}
                style={isDone || isCurrent ? { color: "#fff" } : undefined}
              >
                {isDone ? (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
                    <path d="m3 8 3.5 3.5L13 5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`min-w-0 truncate text-[13px] font-semibold ${
                  isCurrent ? "text-foreground" : "text-foreground/65"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="hidden h-px w-6 bg-foreground/15 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
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
        <h2 className="font-heading text-[20px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <p className="mt-1 text-[13px] text-foreground/60">{hint}</p>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

/* ── Identification step ────────────────────────────────────── */
function IdentifyStep({
  onAuthenticated,
  onContinueAsGuest,
}: {
  onAuthenticated: () => void;
  onContinueAsGuest: () => void;
}) {
  const locale = useLocale();
  const copy = CHECKOUT_COPY[locale];
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || copy.badCredentials);
      await login(data.access_token, data.user);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loginFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      {/* Branded header band */}
      <header className="relative overflow-hidden bg-gradient-to-br from-foreground to-[#00253a] px-6 py-7 text-white md:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(0,168,181,0.45) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b3eef2]">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary-hover" />
            {copy.step1Identify}
          </p>
          <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight md:text-[26px]">
            {copy.beforeFinalize}
          </h2>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-white/75">
            {copy.identifyHint}
          </p>
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-2">
        {/* Left: inline login */}
        <div className="space-y-4 px-6 py-6 lg:border-r lg:border-foreground/5">
          <h3 className="font-heading text-[15px] font-semibold text-foreground">
            {copy.alreadyAccount}
          </h3>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label
                htmlFor="checkout-login-email"
                className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65"
              >
                {copy.email}
              </label>
              <input
                id="checkout-login-email"
                type="email"
                required
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="checkout-login-pw"
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65"
                >
                  {copy.password}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11.5px] font-semibold text-primary transition hover:text-primary-hover"
                >
                  {copy.forgot}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="checkout-login-pw"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 pr-10 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? copy.hide : copy.show}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-foreground/55 transition hover:bg-background hover:text-primary"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3.5 w-3.5">
                    {showPassword ? (
                      <>
                        <path d="M2 2l12 12" />
                        <path d="M3 8s2-4 5-4M13 8s-2 4-5 4" />
                      </>
                    ) : (
                      <>
                        <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
                        <circle cx="8" cy="8" r="2" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[12.5px] text-foreground/75">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-foreground/25 text-primary focus:ring-2 focus:ring-primary/30"
              />
              {copy.remember7d}
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[12.5px] text-error"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="m4.5 4.5 7 7" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ color: "#fff" }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {copy.signingIn}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="M6 2H3v12h3M10 5l3 3-3 3M6 8h7" />
                  </svg>
                  {copy.signInAndContinue}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: signup + guest */}
        <div className="space-y-5 bg-background/30 px-6 py-6">
          <div>
            <h3 className="font-heading text-[15px] font-semibold text-foreground">
              {copy.noAccount}
            </h3>
            <p className="mt-1.5 text-[13px] text-foreground/65">
              {copy.createAccountHint}
            </p>
            <ul
              role="list"
              className="mt-3 space-y-1.5 text-[12.5px] text-foreground/75"
            >
              {[
                copy.benefit1,
                copy.benefit2,
                copy.benefit3,
              ].map((b) => (
                <li key={b} className="inline-flex items-start gap-2">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 flex-none text-primary">
                    <path d="m3 8 3.5 3.5L13 5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                router.push(`/signup?return_to=${encodeURIComponent("/checkout")}`)
              }
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-white px-4 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M8 3v10M3 8h10" />
              </svg>
              {copy.createAccount}
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-foreground/15 bg-white/60 p-4">
            <p className="font-heading text-[13.5px] font-semibold text-foreground">
              {copy.continueGuest}
            </p>
            <p className="mt-1 text-[12px] text-foreground/65">
              {copy.guestHint}
            </p>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="mt-3 inline-flex h-9 items-center gap-1.5 text-[12.5px] font-semibold text-primary transition hover:text-primary-hover"
            >
              {copy.continueWithoutAccount}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                <path d="M3 8h10m-3-3 3 3-3 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const LOCALE_TO_INTL = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar",
  he: "he",
} as const;

const CHECKOUT_COPY_FR = {
    home: "Accueil",
    cart: "Panier",
    breadcrumb: "Fil d'Ariane",
    checkout: "Checkout",
    confirmation: "Confirmation",
    orderConfirmed: "Commande confirmée",
    thankYou: "Merci pour votre commande",
    confirmationEmail: "Un email de confirmation vient d'être envoyé. Votre numéro de commande est",
    viewOrder: "Voir ma commande",
    myOrders: "Mes commandes",
    backToShop: "Retour à la boutique",
    accountCreated: "Compte créé",
    accountCreatedFor: "Un compte a été créé pour",
    checkMailbox: "Consultez votre boîte mail : un lien vous attend pour définir votre mot de passe et retrouver votre commande dans votre espace client.",
    emptyCartTitle: "Votre panier est vide",
    emptyCartBody: "Ajoutez des produits avant de passer à la caisse.",
    browseCatalog: "Parcourir le catalogue",
    stepIdentify: "Identification",
    stepAddress: "Adresse",
    stepPayment: "Paiement",
    step1: "Étape 1",
    step2: "Étape 2",
    step3: "Étape 3",
    billingShippingAddress: "Adresse de facturation et de livraison",
    addressHint: "Choisissez une adresse enregistrée ou ajoutez-en une nouvelle.",
    contactEmail: "Email de contact",
    emailPlaceholder: "vous@exemple.fr",
    emailHelp: "Nous enverrons votre confirmation de commande et un lien pour créer votre mot de passe à cette adresse.",
    selected: "Sélectionnée",
    addAddress: "Ajouter une adresse",
    initializing: "Initialisation…",
    goToPayment: "Passer au paiement",
    newAddress: "Nouvelle adresse",
    saveAddress: "Enregistrer l'adresse",
    guestAddressInfo: "En tant qu'invité, l'adresse sera utilisée uniquement pour cette commande.",
    securePayment: "Paiement sécurisé",
    securePaymentHint: "Vos cartes enregistrées apparaissent automatiquement. Toutes les transactions sont protégées par Stripe (PCI-DSS).",
    backToAddress: "Retour à l'adresse",
    secureConnectionStripe: "Connexion sécurisée · Stripe",
    summary: "Récapitulatif",
    yourOrder: "Votre commande",
    subtotal: "Sous-total",
    vat: "TVA",
    totalInclTax: "Total TTC",
    delivery: "Livraison",
    selectedAddress: "Adresse sélectionnée",
    delivery48h: "Livraison 48 h",
    securePaymentShort: "Paiement sécurisé",
    twoYearWarranty: "Garantie 2 ans",
    createAddressError: "Erreur lors de la création.",
    guestEmailRequired: "Indiquez votre adresse e-mail pour finaliser la commande en invité.",
    addressNotFound: "Adresse introuvable.",
    paymentInitError: "Impossible d'initialiser le paiement.",
    badCredentials: "Identifiants incorrects.",
    loginFailed: "Connexion impossible.",
    step1Identify: "Étape 1 · Identification",
    beforeFinalize: "Avant de finaliser votre commande",
    identifyHint: "Connectez-vous pour récupérer vos adresses et cartes enregistrées, ou continuez en tant qu'invité.",
    alreadyAccount: "J'ai déjà un compte",
    email: "Email",
    password: "Mot de passe",
    forgot: "Oublié ?",
    hide: "Masquer",
    show: "Afficher",
    remember7d: "Se souvenir de moi (7 jours)",
    signingIn: "Connexion…",
    signInAndContinue: "Se connecter et continuer",
    noAccount: "Pas encore de compte ?",
    createAccountHint: "Créez-en un en quelques secondes pour suivre vos commandes, télécharger vos factures et réutiliser vos cartes.",
    benefit1: "Suivi de livraison + historique des commandes",
    benefit2: "Adresses et cartes enregistrées (paiement en 1 clic)",
    benefit3: "Factures PDF Althea Systems",
    createAccount: "Créer un compte",
    continueGuest: "Continuer en invité",
    guestHint: "Vous pourrez créer un compte plus tard pour retrouver vos achats.",
    continueWithoutAccount: "Continuer sans compte",
  };

const CHECKOUT_COPY_EN = {
    home: "Home", cart: "Cart", breadcrumb: "Breadcrumb", checkout: "Checkout", confirmation: "Confirmation",
    orderConfirmed: "Order confirmed", thankYou: "Thank you for your order", confirmationEmail: "A confirmation email has been sent. Your order number is",
    viewOrder: "View my order", myOrders: "My orders", backToShop: "Back to shop", accountCreated: "Account created",
    accountCreatedFor: "An account was created for", checkMailbox: "Check your mailbox: a link is waiting for you to set your password and find your order in your account.",
    emptyCartTitle: "Your cart is empty", emptyCartBody: "Add products before checkout.", browseCatalog: "Browse catalog",
    stepIdentify: "Identification", stepAddress: "Address", stepPayment: "Payment", step1: "Step 1", step2: "Step 2", step3: "Step 3",
    billingShippingAddress: "Billing and shipping address", addressHint: "Choose a saved address or add a new one.", contactEmail: "Contact email",
    emailPlaceholder: "you@example.com", emailHelp: "We will send your order confirmation and a password setup link to this address.",
    selected: "Selected", addAddress: "Add an address", initializing: "Initializing…", goToPayment: "Continue to payment", newAddress: "New address",
    saveAddress: "Save address", guestAddressInfo: "As a guest, this address is used only for this order.", securePayment: "Secure payment",
    securePaymentHint: "Your saved cards appear automatically. All transactions are protected by Stripe (PCI-DSS).", backToAddress: "Back to address",
    secureConnectionStripe: "Secure connection · Stripe", summary: "Summary", yourOrder: "Your order", subtotal: "Subtotal", vat: "VAT",
    totalInclTax: "Total (incl. VAT)", delivery: "Delivery", selectedAddress: "Selected address", delivery48h: "48h delivery",
    securePaymentShort: "Secure payment", twoYearWarranty: "2-year warranty", createAddressError: "Could not create address.",
    guestEmailRequired: "Enter your email address to complete checkout as guest.", addressNotFound: "Address not found.",
    paymentInitError: "Could not initialize payment.", badCredentials: "Invalid credentials.", loginFailed: "Login failed.",
    step1Identify: "Step 1 · Identification", beforeFinalize: "Before finalizing your order",
    identifyHint: "Sign in to reuse your saved addresses and cards, or continue as guest.", alreadyAccount: "I already have an account",
    email: "Email", password: "Password", forgot: "Forgot?", hide: "Hide", show: "Show", remember7d: "Remember me (7 days)",
    signingIn: "Signing in…", signInAndContinue: "Sign in and continue", noAccount: "No account yet?",
    createAccountHint: "Create one in seconds to track orders, download invoices, and reuse your cards.",
    benefit1: "Delivery tracking + order history", benefit2: "Saved addresses and cards (1-click payment)", benefit3: "Althea Systems PDF invoices",
    createAccount: "Create account", continueGuest: "Continue as guest", guestHint: "You can create an account later to find your purchases.",
    continueWithoutAccount: "Continue without account",
  };

const CHECKOUT_COPY = {
  fr: CHECKOUT_COPY_FR,
  en: CHECKOUT_COPY_EN,
  ar: CHECKOUT_COPY_EN,
  he: CHECKOUT_COPY_EN,
} as const;
