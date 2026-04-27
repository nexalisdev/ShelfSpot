"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { BackendApiError } from "@/lib/backend-api";
import { Button } from "@/components/ui/button";
import { COMMON_INPUT_CLASSES } from "@/lib/constants";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const fieldClasses = `${COMMON_INPUT_CLASSES} py-3 pr-10 pl-4`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        console.log("LoginForm: Starting login process", { email });

        try {
            await login(email, password);
            console.log("LoginForm: Login successful, redirecting to dashboard");
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("LoginForm: Login failed", error);
            if (error instanceof BackendApiError) {
                setError("Incorrect email or password.");
            } else {
                setError("Network or server error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={fieldClasses}
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={fieldClasses}
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex min-w-[44px] items-center justify-center pr-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                                <EyeIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 rounded border border-border bg-input text-primary"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground/90">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link
                            href="/forgot-password"
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Sign in failed
                                </h3>
                                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </div>
                    ) : (
                        "Sign in"
                    )}
                </Button>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-card px-2 text-muted-foreground">
                            New to ShelfSpot?
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <Link
                        href="/register"
                        className="app-button-secondary w-full"
                    >
                        Create a free account
                    </Link>
                </div>
            </div>
        </div>
    );
}
