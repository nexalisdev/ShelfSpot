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
    FolderOpen,
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
    { href: "/projects", label: "Projects", icon: FolderOpen },
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

            <aside className="app-sidebar-surface fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col md:flex">
                <div className="border-b border-sidebar-border px-6 py-5">
                    <Link href="/dashboard" className="flex items-center gap-3" aria-label="Go to dashboard">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/20 text-sidebar-primary">
                            <Warehouse className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">ShelfSpot</p>
                            <p className="text-base font-semibold text-sidebar-foreground">Inventory Workspace</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-5" aria-label="Main navigation">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70",
                                isActiveLink(href)
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                                    : "text-sidebar-foreground/82 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                            aria-current={isActiveLink(href) ? "page" : undefined}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4",
                                    isActiveLink(href)
                                        ? "text-sidebar-primary-foreground"
                                        : "text-sidebar-foreground/65 group-hover:text-sidebar-accent-foreground"
                                )}
                            />
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="space-y-2 border-t border-sidebar-border px-4 py-4">
                    <button
                        type="button"
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Create New
                    </button>

                    <button
                        type="button"
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-4 py-2.5 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
                        onClick={() => setShowBulkCreate(true)}
                    >
                        Create multiples
                    </button>
                </div>

                <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-4">
                    <UserChip />
                    <div className="flex items-center gap-1">
                        <ThemeSwitcher />
                        <button
                            aria-label="Open settings"
                            onClick={() => router.push("/settings")}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/70"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

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
                                        ? "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
                                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                )}
                                aria-current={isActiveLink(href) ? "page" : undefined}
                            >
                                <Icon className={cn("h-5 w-5", isActiveLink(href) ? "text-primary-foreground" : "text-current")} />
                                <span className="app-mobile-nav-label">{label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mb-px flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            aria-label="Create new"
                            onClick={() => setShowCreate(true)}
                            className="app-mobile-nav-control inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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







