import React from "react";
import { Providers } from "../utils/providers";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-primary/5" />
      <Providers>
        <div className="relative min-h-screen">{children}</div>
      </Providers>
    </div>
  );
}
