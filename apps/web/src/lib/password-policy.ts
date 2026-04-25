/**
 * Politique de mot de passe — garder aligné avec `apps/api/src/lib/password-policy.ts`.
 */
import type { TranslationKey } from "./translations";

export type TranslateFn = (key: TranslationKey) => string;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_STRENGTH_PATTERN =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export function passwordMeetsPolicy(password: string): boolean {
    return PASSWORD_STRENGTH_PATTERN.test(password);
}

export type PasswordRequirementCheck = {
    id: string;
    /** Texte affiché dans la checklist */
    label: string;
    /** Fragment pour le message « Il manque : … » */
    missingPhrase: string;
    ok: boolean;
};

/** Critères affichés en checklist (ordre lecture). */
export function getPasswordRequirementChecks(
    password: string,
    t: TranslateFn,
): PasswordRequirementCheck[] {
    const len = password.length;
    return [
        {
            id: "length",
            label: t("auth.password.lengthLabel"),
            missingPhrase: t("auth.password.lengthMissing"),
            ok: len >= PASSWORD_MIN_LENGTH && len <= PASSWORD_MAX_LENGTH,
        },
        {
            id: "upper",
            label: t("auth.password.uppercaseLabel"),
            missingPhrase: t("auth.password.uppercaseMissing"),
            ok: /[A-Z]/.test(password),
        },
        {
            id: "digit",
            label: t("auth.password.digitLabel"),
            missingPhrase: t("auth.password.digitMissing"),
            ok: /\d/.test(password),
        },
        {
            id: "symbol",
            label: t("auth.password.symbolLabel"),
            missingPhrase: t("auth.password.symbolMissing"),
            ok: /[^A-Za-z0-9]/.test(password),
        },
    ];
}

/** Message explicite : ce qui manque encore (soumission formulaire). */
export function getPasswordMissingSummary(password: string, t: TranslateFn): string {
    const missing = getPasswordRequirementChecks(password, t)
        .filter((c) => !c.ok)
        .map((c) => c.missingPhrase);
    if (missing.length === 0) return "";
    const intro = t("auth.password.missingIntro");
    const and = t("auth.password.missingAnd");
    if (missing.length === 1) return `${intro}: ${missing[0]}.`;
    if (missing.length === 2) return `${intro}: ${missing[0]} ${and} ${missing[1]}.`;
    const last = missing[missing.length - 1];
    const rest = missing.slice(0, -1);
    return `${intro}: ${rest.join(", ")} ${and} ${last}.`;
}
