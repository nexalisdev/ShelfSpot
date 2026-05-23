"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeSwitcherProps = {
    className?: string;
};

export default function ThemeSwitcher({ className }: Readonly<ThemeSwitcherProps>) {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        setMounted(true);
        let t = localStorage.theme;
        if (t !== "dark" && t !== "light") {
            t = "light";
        }

        document.documentElement.classList.toggle("dark", t === "dark");
        document.documentElement.style.colorScheme = t;
        setTheme(t as "light" | "dark");
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                localStorage.theme = next;
                document.documentElement.classList.toggle("dark", next === "dark");
                document.documentElement.style.colorScheme = next;
            }}
            className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-lg text-current/80 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                className
            )}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
        >
            {theme === "dark" ? (
                <Moon className="h-5 w-5 text-sky-300" />
            ) : (
                <Sun className="h-5 w-5 text-amber-500" />
            )}
        </button>
    );
}
