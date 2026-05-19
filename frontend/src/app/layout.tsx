import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import React from "react";
import { Providers } from "./utils/providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
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
  themeColor: "#0a5adf",
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
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
      <body className={`${manrope.variable} ${sora.variable} app-shell antialiased`}>
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