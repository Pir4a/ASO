"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/context/LocaleContext";

type BuyNowButtonProps = {
  productId: string;
  productName: string;
  disabled?: boolean;
};

export function BuyNowButton({ productId, productName, disabled }: BuyNowButtonProps) {
  const t = useT();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await addItem(productId, 1);
      addToast(t("buynow.addedToCheckout", { name: productName }), "success");
      router.push("/checkout");
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t("buynow.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="rounded-md border-2 border-primary bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:border-foreground/10 disabled:text-foreground/50 disabled:hover:bg-white"
    >
      {loading ? t("buynow.redirecting") : t("buynow.label")}
    </button>
  );
}
