import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { GoogleTagManager } from '@next/third-parties/google'


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
      <GoogleTagManager gtmId="G-NQNYMG2NMR" />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} >
        <Theme>
        {children}
        <footer className="container mx-auto py-8 text-center text-sm text-gray-500">
          citato.ai &copy; 2025 - All rights reserved
          </footer>
        </Theme>
      </body>
    </html>
  );
}
