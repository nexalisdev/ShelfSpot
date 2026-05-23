import React from "react";
import SignUpForm from "@/components/forms/SignUpForm";
import Link from "next/link";
import { Clock3, Grid3X3, ShieldCheck, Sparkles } from "lucide-react";

const registerHighlights = [
  {
    icon: Sparkles,
    title: "Quick onboarding",
    description: "Set up rooms, places and containers in just a few minutes.",
  },
  {
    icon: Clock3,
    title: "Save daily time",
    description: "Find tools and assets instantly instead of searching manually.",
  },
  {
    icon: Grid3X3,
    title: "Scales with your projects",
    description: "Works from small home storage to larger team workspaces.",
  },
  {
    icon: ShieldCheck,
    title: "Private workspace",
    description: "Your inventory data stays controlled and account-protected.",
  },
];

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-border lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-primary/8" />
        <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">ShelfSpot</p>
            <h1 className="app-heading mt-5 max-w-md text-4xl font-bold leading-tight text-foreground">
              Build a reliable inventory system from day one.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Create your workspace and start organizing assets with a structure that stays readable as you grow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {registerHighlights.map(({ icon: Icon, title, description }) => (
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

      <section className="flex items-center justify-center px-6 py-10 md:px-10">
        <div className="app-panel-elevated w-full max-w-md p-8 md:p-10">
          <p className="app-kicker">Create account</p>
          <h2 className="app-heading mt-5 text-3xl font-bold text-foreground">Get started</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in here
            </Link>
          </p>

          <div className="mt-8">
            <SignUpForm />
          </div>
        </div>
      </section>
    </div>
  );
}
