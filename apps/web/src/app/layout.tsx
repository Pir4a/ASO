import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { defaultLocale, isRtl } from "@/lib/i18n.shared";
import { AuthProvider } from "@/context/AuthContext";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Althea Systems – E-commerce médical",
  description:
    "Plateforme e-commerce mobile-first pour équipements médicaux, optimisée SEO et performance.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Althea Systems – E-commerce médical",
    description: "Achat d'équipements médicaux haute performance.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: "Althea Systems",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocaleFromCookie()) || defaultLocale;
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${poppins.variable} ${inter.variable} bg-background text-foreground`}>
        <AuthProvider>
          <Header locale={locale} />
          <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
