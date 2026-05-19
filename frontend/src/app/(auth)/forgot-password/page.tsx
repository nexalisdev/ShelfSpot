"use server";
import React from "react";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
    return (
        <main className="flex min-h-screen w-full items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl">
                <div className="mb-8 text-center">
                    <p className="app-kicker">Account recovery</p>
                    <h1 className="app-heading mt-4 text-4xl font-bold text-foreground md:text-5xl">Reset your password</h1>
                    <p className="mt-3 text-sm text-muted-foreground md:text-base">
                        We&apos;ll send a temporary password to your email so you can securely access your workspace.
                    </p>
                </div>

                <div className="flex justify-center">
                    <ForgotPasswordForm />
                </div>
            </div>
        </main>
    );
}