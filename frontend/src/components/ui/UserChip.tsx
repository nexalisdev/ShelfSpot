"use client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function UserChip() {
    const { user } = useAuth();
    if (!user?.name) return null;
    return (
        <Link href="/settings">
            <span
                className="ml-2 px-3 py-1 rounded-md theme-sidebar text-sm font-medium cursor-pointer hover:theme-primary transition-colors border border-green-500 shadow"
                title="Paramètres utilisateur"
            >
                {user.name}
            </span>
        </Link>
    );
}
