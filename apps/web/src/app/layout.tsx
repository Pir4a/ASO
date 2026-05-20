import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Noto_Sans_Hebrew, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { defaultLocale, isRtl } from "@/lib/i18n.shared";
import { getTranslations } from "@/lib/translations";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { ToastProvider } from "@/components/ui/Toast";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { RouteFlourish } from "@/components/layout/RouteFlourish";
import { LocaleProvider } from "@/context/LocaleContext";

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

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoHebrew = Noto_Sans_Hebrew({
  variable: "--font-hebrew",
  subsets: ["hebrew"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocaleFromCookie()) || defaultLocale;
  const t = getTranslations(locale);
  return {
    title: t("meta.siteTitle"),
    description: t("meta.siteDescription"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    openGraph: {
      title: t("meta.siteTitle"),
      description: t("meta.ogDescription"),
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      siteName: "Althea Systems",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocaleFromCookie()) || defaultLocale;
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${poppins.variable} ${inter.variable} ${notoArabic.variable} ${notoHebrew.variable} bg-background text-foreground`}
      >
        <LocaleProvider locale={locale}>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <SkipLink />
                <Header locale={locale} />
                <main
                  id="main"
                  tabIndex={-1}
                  className="mx-auto min-h-screen w-full max-w-[1300px] px-3 py-6 focus:outline-none sm:px-5 lg:px-6 2xl:max-w-[1600px]"
                >
                  {children}
                </main>
                <Footer />
                <ChatWidget />
                <RouteFlourish />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

