"use client";

import React, { useEffect, useMemo, useState } from "react";
import { backendApi } from "@/lib/backend-api";

interface CreateMultiplePlacesModalProps {
    open: boolean;
    onClose: () => void;
    embedded?: boolean;
}

interface BulkPlaceRow {
    id: string;
    name: string;
    roomId: number | null;
}

interface Room {
    id: number;
    name: string;
}

const createEmptyRow = (): BulkPlaceRow => ({
    id: `${Date.now()}-${Math.random()}`,
    name: "",
    roomId: null,
});

export default function CreateMultiplePlacesModal({ open, onClose, embedded = false }: CreateMultiplePlacesModalProps) {
    const [rows, setRows] = useState<BulkPlaceRow[]>([createEmptyRow()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    useEffect(() => {
        if (open) {
            backendApi.getRooms().then(setRooms).catch(() => { });
        }
    }, [open]);

    const canSubmit = useMemo(
        () => rows.every((r) => Boolean(r.name.trim()) && r.roomId !== null),
        [rows]
    );

    const handleChange = (id: string, field: keyof BulkPlaceRow, value: string | number | null) => {
        setRows((prev) =>
            prev.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        [field]: field === "roomId" ? (value === null ? null : Number(value)) : String(value ?? ""),
                    }
                    : r
            )
        );
    };

    const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
    const removeRow = (id: string) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

    const resetState = () => {
        setRows([createEmptyRow()]);
        setLoading(false);
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!canSubmit) {
            setError("Each line must include a name and a room for the place.");
            setLoading(false);
            return;
        }

        try {
            const payload = rows.map((r) => ({ name: r.name, roomId: r.roomId! }));
            await backendApi.createBulkPlaces(payload);
            setSuccess(true);
            setTimeout(() => {
                resetState();
                onClose();
            }, 700);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2.5">
                {rows.map((row, idx) => (
                    <div key={row.id} className="app-panel-muted space-y-2.5 p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Line {idx + 1}</p>
                            {rows.length > 1 && <button type="button" className="text-xs font-semibold text-destructive hover:underline" onClick={() => removeRow(row.id)}>Remove</button>}
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                            <label className="col-span-12 text-sm text-foreground md:col-span-6">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Place name</span>
                                <input
                                    className="app-input py-2"
                                    value={row.name}
                                    onChange={(e) => handleChange(row.id, "name", e.target.value)}
                                    placeholder="e.g., Kitchen Counter"
                                    required
                                />
                            </label>

                            <label className="col-span-12 text-sm text-foreground md:col-span-6">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Room</span>
                                <select
                                    className="app-input py-2"
                                    value={row.roomId || ""}
                                    onChange={(e) => handleChange(row.id, "roomId", e.target.value ? Number(e.target.value) : null)}
                                    required
                                >
                                    <option value="">Select a room</option>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-accent">Places created successfully.</p>}

            <div className="flex flex-wrap gap-2.5">
                <button type="button" className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted/40 transition-colors" onClick={addRow}>Add another line</button>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="rounded-full border border-border text-muted-foreground px-4 py-2 text-sm hover:bg-muted/60 transition-colors" onClick={() => { resetState(); onClose(); }}>Cancel</button>
                <button type="submit" className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50" disabled={loading || !canSubmit}>{loading ? "Preparing…" : "Bulk create places"}</button>
            </div>
        </form>
    );

    if (embedded) {
        return <div className="p-4 md:p-5 overflow-y-auto max-h-[calc(92vh-165px)]">{formContent}</div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-4">
            <div className="modal-content w-full max-w-3xl rounded-lg border border-border bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Create multiple places</h2>
                        <p className="text-sm text-muted-foreground">Add several places at once (name and room required).</p>
                    </div>
                    <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => { resetState(); onClose(); }}>✕</button>
                </div>
                {formContent}
            </div>
        </div>
    );
}
