"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Box, Star, Settings, Package, Warehouse, FolderOpen } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserChip from "@/components/ui/UserChip";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Dock, DockIcon } from "@/components/magicui/dock";
import CreateObjectModal from "@/components/CreateObjectModal";

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

    return (
        <>
            <CreateObjectModal open={showCreate} onClose={() => setShowCreate(false)} />
            {/* Modern Desktop Sidebar */}
            <aside className=" dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 fixed left-0 top-0 h-full w-[220px] flex-col z-40 hidden md:flex shadow-xl"
            >
                <div className="h-16 flex items-center justify-center ">
                    <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">ShelfSpot</span>
                </div>

                <nav className="flex-1 flex flex-col py-4 px-3">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-sm mb-1 group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-purple-900/20",
                                pathname === href
                                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/50"
                                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                pathname === href ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500"
                            )} />
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4">
                    <button
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        onClick={() => setShowCreate(true)}
                    >
                        + Create New
                    </button>
                </div>

                <div className=" p-4 flex items-center justify-between backdrop-blur-sm">
                    <UserChip />
                    <div className="flex items-center gap-1">
                        <ThemeSwitcher />
                        <button
                            aria-label="Settings"
                            onClick={() => router.push('/settings')}
                            className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
            {/* Mobile Dock */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center pointer-events-none">
                <Dock className="pointer-events-auto">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <DockIcon key={href}>
                            <button
                                aria-label={label}
                                onClick={() => router.push(href)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 text-xs text-zinc-700 dark:text-zinc-200 px-2 py-1 focus:outline-none",
                                    pathname === href && "text-primary"
                                )}
                            >
                                <Icon className="w-6 h-6" />
                            </button>
                        </DockIcon>
                    ))}
                    <DockIcon>
                        <ThemeSwitcher />
                    </DockIcon>
                </Dock>
            </nav>
        </>
    );
}