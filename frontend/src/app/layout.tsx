import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import { Providers } from "./utils/providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShelfSpot",
  description: "Keep an eye on your inventory",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShelfSpot",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/app-ico.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Script to apply the theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var theme = localStorage.theme;
    if (theme !== 'dark' && theme !== 'light') {
      theme = 'light';
    }
    var isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch(e) {}
})();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} app-shell antialiased`}>
        <ServiceWorkerRegistrar />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <div className="flex flex-1">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}