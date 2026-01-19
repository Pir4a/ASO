"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/Toast";

interface AddToCartButtonProps {
    productId: string;
    productName?: string;
    className?: string;
    variant?: "primary" | "small";
}

export function AddToCartButton({
    productId,
    productName,
    className = "",
    variant = "primary"
}: AddToCartButtonProps) {
    const { addItem, isLoading } = useCart();
    const { addToast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if inside a Link
        e.stopPropagation();

        setIsAdding(true);
        try {
            await addItem(productId, 1);
            setShowSuccess(true);
            addToast(productName ? `${productName} ajouté au panier` : "Produit ajouté au panier", "success");
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error: any) {
            addToast(error.message || "Erreur lors de l'ajout au panier", "error");
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
            className={`${baseStyles} ${className} ${showSuccess ? "animate-pulse-success bg-green-600" : ""} transition-all`}
        >
            {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Ajout...
                </span>
            ) : showSuccess ? (
                <span className="flex items-center justify-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ajouté !
                </span>
            ) : (
                "Ajouter au panier"
            )}
        </button>
    );
}
