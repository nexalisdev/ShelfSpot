"use client";
import React, { useState } from "react";
import { backendApi, BackendApiError } from "@/lib/backend-api";
import { Button } from "@/components/ui/button";
import { COMMON_INPUT_CLASSES } from "@/lib/constants";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function SignUpForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const inputClasses = (hasError: boolean) =>
        `${COMMON_INPUT_CLASSES} py-3 pr-10 pl-4 ${hasError ? "border-destructive focus-visible:ring-destructive/30" : ""}`;

    const validateForm = () => {
        const newErrors = {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        };

        if (name.length < 5) {
            newErrors.name = "Username must be at least 5 characters long.";
        }

        if (!email || !email.includes("@")) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters long.";
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== "");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await backendApi.register(email, password, name);

            setMessage("Registration successful! You can now log in.");
            setIsSuccess(true);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setName("");
            setErrors({ name: "", email: "", password: "", confirmPassword: "" });
        } catch (error) {
            if (error instanceof BackendApiError) {
                setMessage(error.message || "Registration error");
            } else {
                setMessage("Network or server error");
            }
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    const passwordRequirements = [
        { text: "At least 6 characters", met: password.length >= 6 },
        { text: "Passwords match", met: password === confirmPassword && password !== "" },
    ];

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="username"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClasses(Boolean(errors.name))}
                        placeholder="Choose a username"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                </div>

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
                        className={inputClasses(Boolean(errors.email))}
                        placeholder="Enter your email"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
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
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClasses(Boolean(errors.password))}
                            placeholder="Create a password"
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
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm password
                    </label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputClasses(Boolean(errors.confirmPassword))}
                            placeholder="Confirm your password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex min-w-[44px] items-center justify-center pr-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-inset"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirmPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                                <EyeIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                    )}
                </div>

                {password && (
                    <div className="app-panel-muted p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password requirements:</h4>
                        <ul className="space-y-1">
                            {passwordRequirements.map((req, index) => (
                                <li key={index} className="flex items-center text-sm">
                                    <CheckCircleIcon
                                        className={`h-4 w-4 mr-2 ${req.met ? "text-green-500" : "text-gray-300 dark:text-gray-600"
                                            }`}
                                    />
                                    <span className={req.met ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                                        {req.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex items-center">
                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 rounded border border-border bg-input text-primary"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:text-primary/80 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 rounded">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:text-primary/80 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 rounded">
                            Privacy Policy
                        </Link>
                    </label>
                </div>

                {message && (
                    <div className={`rounded-md p-4 ${isSuccess
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        }`}>
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className={`text-sm font-medium ${isSuccess ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                                    }`}>
                                    {isSuccess ? "Success!" : "Registration failed"}
                                </h3>
                                <div className={`mt-1 text-sm ${isSuccess ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                                    }`}>
                                    {message}
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
                            Creating account...
                        </div>
                    ) : (
                        "Create account"
                    )}
                </Button>
            </form>

            {isSuccess && (
                <div className="text-center">
                    <Link
                        href="/login"
                        className="app-button-secondary w-full"
                    >
                        Go to sign in
                    </Link>
                </div>
            )}
        </div>
    );
}
