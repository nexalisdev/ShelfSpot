"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { BackendApiError } from "@/lib/backend-api";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await forgotPassword(email);
            setMessage(
                "If an account with this email exists, a temporary password has been sent to your email address."
            );
            setEmail("");
        } catch (error) {
            if (error instanceof BackendApiError) {
                setError(error.message);
            } else {
                setError("Network or server error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="app-panel-elevated">
                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 p-6 md:p-8">
                    <h2 className="text-xl font-bold mb-2">Forgot Password</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Enter your email address and we&apos;ll send you a temporary password.
                    </p>

                    <label htmlFor="forgot-email" className="flex flex-col">
                        Email
                        <input
                            id="forgot-email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="app-input mt-1 min-h-[44px]"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Temporary Password"}
                    </button>

                    {message && (
                        <div className="text-sm text-green-600 dark:text-green-400 mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="text-center mt-4">
                        <Link href="/login" className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 rounded">
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}