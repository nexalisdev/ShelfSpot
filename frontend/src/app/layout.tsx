import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { Providers } from "./utils/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ShelfSpot",
  description: "Keep an eye on your business",
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
            `,
          }}
        />
      </head>
      <body
        className={`antialiased bg-white dark:bg-black`}
        style={{ margin: 0, padding: 0 }}
      >
        <Providers>
          <ErrorBoundary>
            <div className="flex h-screen flex-col">
              <div className="flex-1 flex">
                {children}
              </div>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
