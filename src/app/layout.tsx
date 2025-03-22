import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "citato.ai",
  description: "Your AI-powered reading companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-56ZPVQ4L" />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} >
        <Theme>
        {children}

        <Analytics />
        <SpeedInsights />
        <footer className="container mx-auto py-8 text-center text-sm text-gray-500">
          citato.ai &copy; 2025 - All rights reserved
          </footer>
        </Theme>
      </body>
      <GoogleAnalytics gaId="G-NQNYMG2NMR" />
    </html>
  );
}
