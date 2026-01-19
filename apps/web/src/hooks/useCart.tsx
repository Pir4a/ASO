"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getCart, addToCart, updateCartItem, removeCartItem, applyPromoCode } from "@/lib/api";

// Generate or retrieve guest cart ID from localStorage
// Generate or retrieve guest cart ID from localStorage
function getGuestCartId(): string {
    if (typeof window === "undefined") return "";

    let guestId = localStorage.getItem("guestCartId");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!guestId || !uuidRegex.test(guestId)) {
        // Use crypto.randomUUID() if available, otherwise a simple fallback
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            guestId = crypto.randomUUID();
        } else {
            // Simple UUID v4 fallback
            guestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        localStorage.setItem("guestCartId", guestId);
    }
    return guestId;
}

export interface CartItem {
    productId: string;
    quantity: number;
    priceCents: number;
    currency: string;
    name?: string;
    stock?: number;
}

export interface CartState {
    items: CartItem[];
    subtotal: number;
    vat: number;
    total: number;
    discount: number;
    promoCode: string | null;
    currency: string;
    isLoading: boolean;
    error: string | null;
}

interface CartContextType extends CartState {
    addItem: (productId: string, quantity?: number) => Promise<void>;
    updateItem: (productId: string, quantity: number) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    applyPromo: (code: string) => Promise<void>;
    refreshCart: () => Promise<void>;
    clearError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartState>({
        items: [],
        subtotal: 0,
        vat: 0,
        total: 0,
        discount: 0,
        promoCode: null,
        currency: "EUR",
        isLoading: true,
        error: null,
    });

    const guestCartId = typeof window !== "undefined" ? getGuestCartId() : "";

    const refreshCart = useCallback(async () => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));
            const data = await getCart(guestCartId);
            setCart(prev => ({
                ...prev,
                items: data.items,
                subtotal: data.subtotal,
                vat: data.vat,
                total: data.total - prev.discount,
                currency: data.currency,
                isLoading: false,
            }));
        } catch (error) {
            setCart(prev => ({ ...prev, isLoading: false, error: "Failed to load cart" }));
        }
    }, [guestCartId]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addItem = async (productId: string, quantity = 1) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));
            await addToCart(productId, quantity, guestCartId);
            await refreshCart();
        } catch (error: any) {
            setCart(prev => ({ ...prev, isLoading: false, error: error.message }));
        }
    };

    const updateItem = async (productId: string, quantity: number) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));
            await updateCartItem(productId, quantity, guestCartId);
            await refreshCart();
        } catch (error: any) {
            setCart(prev => ({ ...prev, isLoading: false, error: error.message }));
        }
    };

    const removeItem = async (productId: string) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));
            await removeCartItem(productId, guestCartId);
            await refreshCart();
        } catch (error: any) {
            setCart(prev => ({ ...prev, isLoading: false, error: error.message }));
        }
    };

    const applyPromo = async (code: string) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));
            const result = await applyPromoCode(code, cart.subtotal);
            setCart(prev => ({
                ...prev,
                discount: result.discount,
                promoCode: code,
                total: prev.subtotal + prev.vat - result.discount,
                isLoading: false,
            }));
        } catch (error: any) {
            setCart(prev => ({ ...prev, isLoading: false, error: error.message }));
        }
    };

    const clearError = () => {
        setCart(prev => ({ ...prev, error: null }));
    };

    return (
        <CartContext.Provider
            value={{
                ...cart,
                addItem,
                updateItem,
                removeItem,
                applyPromo,
                refreshCart,
                clearError,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
