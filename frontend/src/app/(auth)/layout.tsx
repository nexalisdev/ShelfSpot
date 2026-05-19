import React from "react";
import { Providers } from "../utils/providers";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_88%_0%,rgba(16,185,129,0.12),transparent_30%)]" />
      <Providers>
        <div className="relative min-h-screen">{children}</div>
      </Providers>
    </div>
  );
}
