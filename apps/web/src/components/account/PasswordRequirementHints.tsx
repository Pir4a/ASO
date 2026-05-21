"use client";

import { useT } from "@/context/LocaleContext";
import {
    getPasswordRequirementChecks,
    getPasswordMissingSummary,
    passwordMeetsPolicy,
} from "@/lib/password-policy";

type Props = {
    password: string;
    className?: string;
};

/**
 * Liste des critères de mot de passe avec état OK / à faire (mise à jour en direct).
 */
export function PasswordRequirementHints({ password, className = "" }: Props) {
    const t = useT();
    const checks = getPasswordRequirementChecks(password, t);
    const summary =
        password.length > 0 && !passwordMeetsPolicy(password)
            ? getPasswordMissingSummary(password, t)
            : null;

    return (
        <div
            className={`mt-2 rounded-md border border-foreground/10 bg-background/50 px-3 py-2.5 text-[11.5px] leading-snug ${className}`}
        >
            {summary ? (
                <p className="mb-2 text-[12px] font-semibold text-error" role="status">
                    {summary}
                </p>
            ) : null}
            <ul className="space-y-1" aria-label={t("auth.password.checklistAriaLabel")}>
                {checks.map((c) => (
                    <li
                        key={c.id}
                        className={
                            c.ok
                                ? "font-medium text-success"
                                : "text-foreground/60"
                        }
                    >
                        <span aria-hidden="true" className="me-1.5 inline-block w-3.5 text-center">
                            {c.ok ? "✓" : "·"}
                        </span>
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
