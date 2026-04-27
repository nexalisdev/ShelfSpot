import React from "react";
import { COMMON_INPUT_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FormFieldProps {
    label: string;
    name: string;
    type?: "text" | "number" | "email" | "password" | "checkbox";
    value?: string | number;
    defaultValue?: string | number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    className?: string;
    children?: React.ReactNode;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function FormField({
    label,
    name,
    type = "text",
    value,
    defaultValue,
    placeholder,
    required = false,
    disabled = false,
    min,
    max,
    step,
    className,
    children,
    onChange,
}: FormFieldProps) {
    const inputId = `field-${name}`;

    if (type === "checkbox") {
        return (
            <div className={cn("col-span-full", className)}>
                <label htmlFor={inputId} className="flex items-center text-sm font-medium text-foreground">
                    <input
                        id={inputId}
                        name={name}
                        type="checkbox"
                        className="mr-2 h-4 w-4 rounded border border-border bg-input text-primary"
                        onChange={onChange}
                    />
                    <span>{label}</span>
                </label>
            </div>
        );
    }

    // Use controlled or uncontrolled input pattern
    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
        id: inputId,
        name,
        type,
        placeholder,
        required,
        disabled,
        min,
        max,
        step,
        className: COMMON_INPUT_CLASSES,
        onChange,
        "aria-required": required || undefined,
    };

    // If value is provided, use controlled input
    if (value !== undefined) {
        inputProps.value = value;
    } else if (defaultValue !== undefined) {
        inputProps.defaultValue = defaultValue;
    }

    return (
        <div className={className}>
            <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
                <span className="mb-2 block">{label}</span>
                {children ? children : <input {...inputProps} />}
            </label>
        </div>
    );
}

interface SelectFieldProps extends Omit<FormFieldProps, "type" | "children"> {
    options: Array<{ value: string | number; label: string }>;
    emptyLabel?: string;
}

export function SelectField({
    label,
    name,
    value,
    required = false,
    disabled = false,
    className,
    options,
    emptyLabel = "Select an option",
    onChange,
}: SelectFieldProps) {
    const selectId = `field-${name}`;
    return (
        <div className={className}>
            <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
                <span className="mb-2 block">{label}</span>
                <select
                    id={selectId}
                    name={name}
                    value={value}
                    required={required}
                    disabled={disabled}
                    aria-required={required || undefined}
                    className={COMMON_INPUT_CLASSES}
                    onChange={onChange}
                >
                    <option value="">{emptyLabel}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
