"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Box,
    Star,
    Settings,
    Package,
    Warehouse,
    Plus,
} from "lucide-react";
import { useState } from "react";
import UserChip from "@/components/ui/UserChip";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import CreateObjectModal from "@/components/CreateObjectModal";
import CreateMultipleModal from "@/components/CreateMultipleModal";

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/inventory", label: "Inventory", icon: Warehouse },
    { href: "/consumables", label: "Consumables", icon: Package },
    { href: "/favourites", label: "Favorites", icon: Star },
    { href: "/manage", label: "Manage", icon: Box },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [showCreate, setShowCreate] = useState(false);
    const [showBulkCreate, setShowBulkCreate] = useState(false);
    const isAnyModalOpen = showCreate || showBulkCreate;

    const isActiveLink = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <>
            <CreateObjectModal open={showCreate} onClose={() => setShowCreate(false)} />
            <CreateMultipleModal open={showBulkCreate} onClose={() => setShowBulkCreate(false)} />

            {/* Desktop sidebar */}
            <aside className="app-sidebar-surface fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col md:flex">
                {/* Brand header */}
                <div className="border-b border-sidebar-border px-5 py-4">
                    <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Go to dashboard">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Warehouse className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-sidebar-foreground">ShelfSpot</span>
                    </Link>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-3 py-4" aria-label="Main navigation">
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        Navigation
                    </p>
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "group flex min-h-[36px] items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70",
                                isActiveLink(href)
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                            aria-current={isActiveLink(href) ? "page" : undefined}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Action buttons */}
                <div className="space-y-1.5 border-t border-sidebar-border px-3 py-4">
                    <button
                        type="button"
                        className="inline-flex min-h-[36px] w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Create New
                    </button>

                    <button
                        type="button"
                        className="inline-flex min-h-[36px] w-full items-center justify-center gap-2 rounded-full border border-sidebar-border bg-transparent px-4 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
                        onClick={() => setShowBulkCreate(true)}
                    >
                        Create multiples
                    </button>
                </div>

                {/* User / controls */}
                <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-3">
                    <UserChip />
                    <div className="flex items-center gap-1">
                        <ThemeSwitcher />
                        <button
                            aria-label="Open settings"
                            onClick={() => router.push("/settings")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav
                className={cn(
                    "app-mobile-nav-safe fixed inset-x-0 bottom-0 z-50 md:hidden",
                    isAnyModalOpen && "hidden"
                )}
                aria-label="Mobile navigation"
                aria-hidden={isAnyModalOpen}
            >
                <div className="app-panel-elevated flex items-end gap-2 rounded-2xl bg-card/95 p-2 backdrop-blur">
                    <div className="scrollbar-hide app-mobile-nav-scroll flex min-w-0 flex-1 items-stretch gap-2 overflow-x-auto pb-1">
                        {navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "app-mobile-nav-item group inline-flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-center font-medium transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                                    isActiveLink(href)
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                )}
                                aria-current={isActiveLink(href) ? "page" : undefined}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="app-mobile-nav-label">{label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mb-px flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            aria-label="Create new"
                            onClick={() => setShowCreate(true)}
                            className="app-mobile-nav-control inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                        >
                            <Plus className="h-5 w-5" />
                        </button>

                        <ThemeSwitcher className="app-mobile-nav-control" />
                    </div>
                </div>
            </nav>
        </>
    );
}
