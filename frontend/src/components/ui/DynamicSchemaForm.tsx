"use client";

import React, { useState } from "react";

interface SchemaProperty {
    type?: string;
    title?: string;
}

interface Schema {
    properties?: Record<string, SchemaProperty>;
    required?: string[];
}

type FormRow = Record<string, string | number | boolean | null | undefined>;

interface DynamicSchemaFormProps {
    schema: Schema;
    initialRows?: FormRow[];
    onSubmit: (rows: FormRow[]) => Promise<void> | void;
    options?: { [key: string]: Array<{ value: string | number; label: string }> };
}

export default function DynamicSchemaForm({ schema, initialRows = [{}], onSubmit, options = {} }: DynamicSchemaFormProps) {
    const [rows, setRows] = useState<FormRow[]>(initialRows.length ? initialRows : [{}]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addRow = () => setRows((r) => [...r, {}]);
    const removeRow = (idx: number) => setRows((r) => (r.length === 1 ? r : r.filter((_, i) => i !== idx)));

    const handleChange = (idx: number, key: string, value: string | number | boolean | null | undefined) => {
        setRows((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
    };

    const validateRow = (row: FormRow) => {
        if (!schema) return true;
        const required: string[] = schema.required || [];
        for (const r of required) {
            const v = row[r];
            if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return false;
        }
        return true;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        const invalidIndex = rows.findIndex((row) => !validateRow(row));
        if (invalidIndex !== -1) {
            setError(`Line ${invalidIndex + 1} is missing required fields`);
            return;
        }
        setLoading(true);
        try {
            await onSubmit(rows);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const properties = schema?.properties ? Object.entries(schema.properties) : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {rows.map((row, idx) => (
                <div key={idx} className="grid gap-3 rounded-sm border p-3">
                    <div className="grid grid-cols-12 gap-3">
                        {properties.map(([key, def]: [string, SchemaProperty]) => {
                            const title = def.title || key;
                            const required = (schema.required || []).includes(key);
                            const fieldType = def.type || "string";
                            const opts = options[key];
                            return (
                                <label key={key} className="col-span-12 sm:col-span-6 text-sm text-gray-900 dark:text-white">
                                    <span className="block mb-1 font-medium">{title}{required ? " *" : ""}</span>
                                    {opts ? (
                                        <select className="w-full rounded-sm border px-3 py-2" value={row[key] ?? ""} onChange={(e) => handleChange(idx, key, e.target.value ? Number(e.target.value) : null)}>
                                            <option value="">Select</option>
                                            {opts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                                        </select>
                                    ) : fieldType === "integer" || fieldType === "number" ? (
                                        <input type="number" className="w-full rounded-sm border px-3 py-2" value={row[key] ?? ""} onChange={(e) => handleChange(idx, key, e.target.value === "" ? undefined : Number(e.target.value))} />
                                    ) : fieldType === "boolean" ? (
                                        <input type="checkbox" checked={Boolean(row[key])} onChange={(e) => handleChange(idx, key, e.target.checked)} />
                                    ) : (
                                        <input type="text" className="w-full rounded-sm border px-3 py-2" value={row[key] ?? ""} onChange={(e) => handleChange(idx, key, e.target.value)} />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <p>Line {idx + 1}</p>
                        {rows.length > 1 && <button type="button" className="text-red-500" onClick={() => removeRow(idx)}>Remove</button>}
                    </div>
                </div>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
                <button type="button" className="rounded-sm border border-dashed px-4 py-2 text-sm font-semibold" onClick={addRow}>Add another line</button>
                <button type="submit" className="ml-auto rounded-sm bg-blue-600 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Preparing…" : "Bulk create"}</button>
            </div>
        </form>
    );
}
