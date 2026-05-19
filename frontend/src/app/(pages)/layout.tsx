"use client";

import Sidebar from "@/components/Sidebar";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell relative flex min-h-dvh w-full">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col md:pl-[264px]">
        <main className="app-main-mobile-spacing app-page-inline-padding flex-1 overflow-y-auto pt-6 md:pt-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
