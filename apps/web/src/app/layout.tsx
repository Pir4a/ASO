import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { defaultLocale, isRtl } from "@/lib/i18n.shared";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { ToastProvider } from "@/components/ui/Toast";
import { ChatWidget } from "@/components/chat/ChatWidget";
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

export const metadata: Metadata = {
  title: "Althea Systems – E-commerce médical",
  description:
    "Your trusted source for premium medical equipment and devices. Fast delivery, expert support, competitive pricing across Europe.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Althea Systems – E-commerce médical",
    description: "Premium medical equipment and devices for healthcare professionals across Europe.",
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
        <LocaleProvider locale={locale}>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <Header locale={locale} />
                <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">{children}</main>
                <Footer />
                <ChatWidget />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

