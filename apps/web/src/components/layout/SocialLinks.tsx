"use client";

import { useT } from "@/context/LocaleContext";
import type { TranslationKey } from "@/lib/translations";
import type { JSX } from "react";

type IconName = "linkedin" | "twitter" | "facebook" | "instagram" | "youtube";

interface SocialLink {
  name: IconName;
  href: string;
  labelKey: TranslationKey;
}

const links: SocialLink[] = [
  { name: "linkedin", href: "https://www.linkedin.com/company/althea-systems", labelKey: "social.linkedin" },
  { name: "twitter", href: "https://twitter.com/altheasystems", labelKey: "social.twitter" },
  { name: "facebook", href: "https://www.facebook.com/altheasystems", labelKey: "social.facebook" },
  { name: "instagram", href: "https://www.instagram.com/altheasystems", labelKey: "social.instagram" },
  { name: "youtube", href: "https://www.youtube.com/@altheasystems", labelKey: "social.youtube" },
];

const icons: Record<IconName, JSX.Element> = {
  linkedin: (
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8 17v-7H6v7h2ZM7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm11 8v-3.9c0-2.1-1.1-3-2.6-3-1.2 0-1.7.6-2 1.1V10h-2v7h2v-3.8c0-.2 0-.5.1-.7.2-.4.6-.9 1.4-.9 1 0 1.4.7 1.4 1.9V17h2Z" />
  ),
  twitter: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  ),
  facebook: (
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  ),
  instagram: (
    <>
      <path d="M12 2.2c3.2 0 3.58 0 4.84.07 1.17.06 1.8.25 2.22.42.56.21.96.47 1.38.89.42.42.68.82.9 1.38.16.42.35 1.05.41 2.22.06 1.26.07 1.64.07 4.84s0 3.58-.07 4.84c-.06 1.17-.25 1.8-.42 2.22a3.7 3.7 0 0 1-.89 1.38c-.42.42-.82.68-1.38.9-.42.16-1.05.35-2.22.41-1.26.06-1.64.07-4.84.07s-3.58 0-4.84-.07c-1.17-.06-1.8-.25-2.22-.42a3.7 3.7 0 0 1-1.38-.89 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.35-1.05-.41-2.22C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.84c.06-1.17.25-1.8.42-2.22.21-.56.47-.96.89-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.35 2.22-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.26.82-.38.38-.62.75-.82 1.26-.15.39-.33.97-.38 2.04-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.07.23 1.65.38 2.04.2.51.44.88.82 1.26.38.38.75.62 1.26.82.39.15.97.33 2.04.38 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.26-.82.38-.38.62-.75.82-1.26.15-.39.33-.97.38-2.04.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.07-.23-1.65-.38-2.04a3 3 0 0 0-.82-1.26 3 3 0 0 0-1.26-.82c-.39-.15-.97-.33-2.04-.38C15.5 4 15.15 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
    </>
  ),
  youtube: (
    <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26.14 26.14 0 0 0 2 12a26.14 26.14 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.14 26.14 0 0 0 22 12a26.14 26.14 0 0 0-.42-4.81ZM10 15.5v-7l6 3.5-6 3.5Z" />
  ),
};

interface SocialLinksProps {
  variant?: "dark" | "light";
}

export function SocialLinks({ variant = "dark" }: SocialLinksProps) {
  const t = useT();

  const baseClass =
    variant === "dark"
      ? "text-slate-300 hover:text-white focus:text-white"
      : "text-slate-500 hover:text-primary focus:text-primary";

  return (
    <ul className="flex items-center gap-3" aria-label={t("social.followUs")}>
      {links.map((link) => (
        <li key={link.name}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(link.labelKey)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${baseClass}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
            >
              {icons[link.name]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
