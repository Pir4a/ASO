"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyPromoCode } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, Tag } from "lucide-react";

interface PromoCodeInputProps {
    orderTotal: number; // in cents
    onDiscountApplied?: (discount: number, code: string) => void;
    disabled?: boolean;
}

export function PromoCodeInput({ orderTotal, onDiscountApplied, disabled }: PromoCodeInputProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number; code: string } | null>(null);

    const handleApply = async () => {
        if (!code.trim()) {
            setError("Veuillez entrer un code promo");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await applyPromoCode(code.toUpperCase(), orderTotal);
            setAppliedDiscount({ amount: result.discount, code: code.toUpperCase() });
            setError(null);
            onDiscountApplied?.(result.discount, code.toUpperCase());
        } catch (err: any) {
            setError(err.message || "Code promo invalide");
            setAppliedDiscount(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = () => {
        setAppliedDiscount(null);
        setCode("");
        setError(null);
        onDiscountApplied?.(0, "");
    };

    if (appliedDiscount) {
        return (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                    <CheckCircle className="size-5 text-green-600" />
                    <div>
                        <p className="text-sm font-medium text-green-800">
                            Code <span className="font-bold">{appliedDiscount.code}</span> appliqué !
                        </p>
                        <p className="text-xs text-green-600">
                            -{(appliedDiscount.amount / 100).toFixed(2)} €
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="text-green-700 hover:text-green-900 hover:bg-green-100"
                >
                    Retirer
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Entrer un code promo"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        className="pl-9 uppercase"
                        disabled={disabled || isLoading}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleApply();
                            }
                        }}
                    />
                </div>
                <Button
                    onClick={handleApply}
                    disabled={disabled || isLoading || !code.trim()}
                    variant="outline"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        "Appliquer"
                    )}
                </Button>
            </div>
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="size-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
