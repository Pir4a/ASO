/** Keep in sync with `apps/api/src/lib/password-policy.ts` → PASSWORD_TOO_WEAK_CODE */
export const PASSWORD_TOO_WEAK_CODE = "PASSWORD_TOO_WEAK";

export function firstHttpErrorMessage(message: unknown): string | null {
    if (typeof message === "string") return message;
    if (Array.isArray(message)) {
        for (const item of message) {
            if (typeof item === "string") return item;
        }
    }
    return null;
}

/** API validation / profile may return a stable code or legacy French copy. */
export function isPasswordTooWeakApiMessage(message: unknown): boolean {
    const s = firstHttpErrorMessage(message);
    if (!s) return false;
    if (s === PASSWORD_TOO_WEAK_CODE) return true;
    if (s.startsWith("Mot de passe trop faible")) return true;
    return false;
}
