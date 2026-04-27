"use client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function UserChip() {
    const { user } = useAuth();

    if (!user?.name) {
        return null;
    }

    return (
        <Link
            href="/settings"
            className="inline-flex max-w-[140px] items-center rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-primary hover:text-sidebar-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
            title="User settings"
        >
            <span className="truncate">{user.name}</span>
        </Link>
    );
}
