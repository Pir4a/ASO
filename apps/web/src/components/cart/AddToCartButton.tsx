"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/context/LocaleContext";

interface AddToCartButtonProps {
    productId: string;
    productName?: string;
    className?: string;
    variant?: "primary" | "small";
    quantity?: number;
}

export function AddToCartButton({
    productId,
    productName,
    className = "",
    variant = "primary",
    quantity = 1,
}: AddToCartButtonProps) {
    const t = useT();
    const { addItem, isLoading } = useCart();
    const { addToast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const qty = Math.max(1, Math.floor(quantity));
        setIsAdding(true);
        try {
            await addItem(productId, qty);
            setShowSuccess(true);
            const name = productName ?? t("cart.productFallback");
            const msg =
                qty > 1
                    ? t("cart.addedMultiple").replace("{name}", name).replace("{qty}", String(qty))
                    : t("cart.addedSingle").replace("{name}", name);
            addToast(msg, "success");
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : t("cart.addError");
            addToast(msg, "error");
        } finally {
            setIsAdding(false);
        }
    };

    const baseStyles = variant === "primary"
        ? "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
        : "rounded-md bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary disabled:opacity-50";

    return (
        <button
            onClick={handleClick}
            disabled={isAdding || isLoading}
            className={`${baseStyles} ${className} ${showSuccess ? "animate-pulse-success bg-success" : ""} transition-all`}
        >
            {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t("cart.adding")}
                </span>
            ) : showSuccess ? (
                <span className="flex items-center justify-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("cart.added")}
                </span>
            ) : (
                t("cart.addToCart")
            )}
        </button>
    );
}
