import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "VerdOlive — Investir dans l'agriculture tunisienne", template: "%s · VerdOlive" },
  description:
    "VerdOlive met en relation investisseurs et porteurs de terrain en Tunisie : terrains agricoles avec titre foncier et eau, vente, location ou partenariat Mgharsa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${cormorant.variable} antialiased min-h-screen flex flex-col`}>
        <NuqsAdapter>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NuqsAdapter>
      </body>
    </html>
  );
}
