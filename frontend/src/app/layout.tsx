import type { Metadata, Viewport } from "next";
import { Oswald, Manrope, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { getSession } from "@/shared/auth/session";
import { isReal } from "@/shared/api/client";
import { Providers } from "./providers";
import { DevRoleSwitcher } from "@/features/dev/role-switcher";
import "./globals.css";

const oswald = Oswald({ subsets: ["latin", "cyrillic"], weight: ["500", "600", "700"], variable: "--font-oswald", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "CTS — CRM для киберспортивных турниров", template: "%s · CTS" },
  description: "Регистрация команд, автоматическая сетка, расписание и результаты матчей — в одной панели.",
  openGraph: { siteName: "CTS", type: "website", locale: "ru_RU" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d11",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, user] = await Promise.all([getLocale(), getSession()]);
  return (
    <html lang={locale} className={`${oswald.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers user={user}>
            {children}
            {!isReal("me") && <DevRoleSwitcher />}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
