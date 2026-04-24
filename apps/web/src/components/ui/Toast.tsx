"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type?: "success" | "error" | "info") => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    // We keep the container mounted so the aria-live region is stable and screen
    // readers reliably announce changes. Two regions: polite for info/success,
    // assertive for errors.
    const polite = toasts.filter((t) => t.type !== "error");
    const assertive = toasts.filter((t) => t.type === "error");

    const renderToast = (toast: Toast) => (
        <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`
            animate-slide-in flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg
            ${toast.type === "success" ? "bg-success text-white" : ""}
            ${toast.type === "error" ? "bg-error text-white" : ""}
            ${toast.type === "info" ? "bg-primary text-white" : ""}
          `}
        >
            {toast.type === "success" && (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {toast.type === "error" && (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="ml-2 rounded hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
            >
                <span aria-hidden="true">✕</span>
            </button>
        </div>
    );

    return (
        <>
            <div
                aria-live="polite"
                aria-atomic="true"
                className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 rtl:left-4 rtl:right-auto"
            >
                <div className="pointer-events-auto flex flex-col gap-2">
                    {polite.map(renderToast)}
                </div>
            </div>
            <div
                aria-live="assertive"
                aria-atomic="true"
                role="region"
                aria-label="Errors"
                className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 rtl:left-4 rtl:right-auto"
            >
                <div className="pointer-events-auto flex flex-col gap-2">
                    {assertive.map(renderToast)}
                </div>
            </div>
        </>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
