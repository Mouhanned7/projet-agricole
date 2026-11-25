import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_Arabic } from "next/font/google";
import { ArabicTranslator } from "@/components/i18n/arabic-translator";
import { getLocale } from "@/lib/i18n/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { FlashMessage, VerifyEmailBanner } from "@/components/account/verify-email";
import { getSession } from "@/lib/auth/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const arabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], preload: false });

export const metadata: Metadata = {
  title: { default: "VerdOlive — Investir dans l'agriculture tunisienne", template: "%s · VerdOlive" },
  description:
    "VerdOlive met en relation investisseurs et porteurs de terrain en Tunisie : terrains agricoles avec titre foncier et eau, vente, location ou partenariat Mgharsa.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-i18n={locale === "ar" ? "pending" : undefined} suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} ${arabic.variable} antialiased min-h-screen flex flex-col`}>
        {locale === "ar" && <ArabicTranslator />}
        <NuqsAdapter>
          <SiteHeader />
          {session?.profile && !session.profile.email_verified_at && <VerifyEmailBanner email={session.email} />}
          <Suspense>
            <FlashMessage />
          </Suspense>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NuqsAdapter>
      </body>
    </html>
  );
}
