import React from "react";
import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";
import { BarChart3, Boxes, SearchCheck, ShieldCheck } from "lucide-react";

const loginHighlights = [
  {
    icon: Boxes,
    title: "Structured inventory",
    description: "Track items, places and containers in one unified workspace.",
  },
  {
    icon: SearchCheck,
    title: "Fast retrieval",
    description: "Find exactly what you need with contextual location details.",
  },
  {
    icon: BarChart3,
    title: "Actionable analytics",
    description: "Monitor stock, alerts and value trends with clear dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "Your account and inventory data remain private and protected.",
  },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-10 md:px-10">
        <div className="app-panel-elevated w-full max-w-md p-8 md:p-10">
          <p className="app-kicker">Sign in</p>
          <h1 className="app-heading mt-5 text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up for free
            </Link>
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-border lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/15" />
        <div className="absolute -top-28 -right-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">ShelfSpot</p>
            <h2 className="app-heading mt-5 max-w-md text-4xl font-bold leading-tight text-foreground">
              Your inventory, cleanly organized and always searchable.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loginHighlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="app-panel bg-card/85 p-4">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
