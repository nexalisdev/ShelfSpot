"use client";

import React, { useMemo, useState, useEffect } from "react";
import { backendApi } from "@/lib/backend-api";

interface CreateMultipleItemsModalProps {
    open: boolean;
    onClose: () => void;
    embedded?: boolean;
}

interface BulkItemRow {
    id: string;
    name: string;
    quantity: number;
    itemLink?: string;
    roomId: number | null;
}

interface Room { id: number; name: string; }

const createEmptyRow = (): BulkItemRow => ({
    id: `${Date.now()}-${Math.random()}`,
    name: "",
    quantity: 1,
    itemLink: "",
    roomId: null,
});

export default function CreateMultipleItemsModal({ open, onClose, embedded = false }: CreateMultipleItemsModalProps) {
    const [items, setItems] = useState<BulkItemRow[]>([createEmptyRow()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    const canSubmit = useMemo(
        () =>
            items.every(
                (item) =>
                    Boolean(item.name.trim()) &&
                    item.quantity > 0 &&
                    item.roomId !== null
            ),
        [items]
    );

    const handleChange = (id: string, field: keyof BulkItemRow, value: string | number | null) => {
        setItems((previous) =>
            previous.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [field]: field === "quantity"
                            ? Math.max(1, Number(value) || 1)
                            : field === "roomId"
                                ? (value === null ? null : Number(value))
                                : String(value ?? ""),
                    }
                    : item
            )
        );
    };

    const addRow = () => {
        setItems((previous) => [...previous, createEmptyRow()]);
    };

    const removeRow = (id: string) => {
        setItems((previous) => (previous.length === 1 ? previous : previous.filter((item) => item.id !== id)));
    };

    const resetState = () => {
        setItems([createEmptyRow()]);
        setLoading(false);
        setError(null);
        setSuccess(false);
    };

    const fetchRooms = async () => {
        try {
            const roomsData = await backendApi.getRooms();
            setRooms(roomsData);
        } catch (roomFetchError) {
            console.error("Failed to load rooms", roomFetchError);
        }
    };

    useEffect(() => {
        if (open) {
            fetchRooms();
        }
    }, [open]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!canSubmit) {
            setError("Every line must include a room, a name, and a positive quantity.");
            setLoading(false);
            return;
        }

        try {
            const payload = items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                itemLink: item.itemLink || undefined,
                roomId: item.roomId,
                consumable: false,
            }));

            await backendApi.createBulkItems(payload);
            setSuccess(true);

            setTimeout(() => {
                resetState();
                onClose();
            }, 700);
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    if (!open) {
        return null;
    }

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2.5">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="app-panel-muted space-y-2.5 p-3"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Line {index + 1}
                            </p>
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-destructive transition-colors hover:underline"
                                    onClick={() => removeRow(item.id)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                            <label className="col-span-12 text-sm text-foreground md:col-span-4">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Item name</span>
                                <input
                                    className="app-input py-2"
                                    value={item.name}
                                    onChange={(event) => handleChange(item.id, "name", event.target.value)}
                                    placeholder="e.g., Box of screws"
                                    required
                                />
                            </label>

                            <label className="col-span-12 text-sm text-foreground md:col-span-3">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Room</span>
                                <select
                                    className="app-input py-2"
                                    value={item.roomId ?? ""}
                                    onChange={(event) => handleChange(item.id, "roomId", event.target.value ? Number(event.target.value) : null)}
                                    required
                                >
                                    <option value="" disabled>
                                        {rooms.length === 0 ? "Loading rooms..." : "Select a room"}
                                    </option>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="col-span-6 text-sm text-foreground md:col-span-2">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Quantity</span>
                                <input
                                    type="number"
                                    min={1}
                                    className="app-input py-2"
                                    value={item.quantity}
                                    onChange={(event) => handleChange(item.id, "quantity", Number(event.target.value) || 1)}
                                    required
                                />
                            </label>

                            <label className="col-span-6 text-sm text-foreground md:col-span-3">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Item link (optional)</span>
                                <input
                                    className="app-input py-2"
                                    value={item.itemLink}
                                    onChange={(event) => handleChange(item.id, "itemLink", event.target.value)}
                                    placeholder="https://..."
                                />
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-accent">Items prepared, backend call pending.</p>}

            <div className="flex flex-wrap gap-2.5">
                <button
                    type="button"
                    className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
                    onClick={addRow}
                >
                    Add another line
                </button>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    className="rounded-full border border-border text-muted-foreground px-4 py-2 text-sm font-semibold hover:bg-muted/60 transition-colors"
                    onClick={() => {
                        resetState();
                        onClose();
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={loading || !canSubmit}
                >
                    {loading ? "Preparing…" : "Bulk creation"}
                </button>
            </div>
        </form>
    );

    if (embedded) {
        return <div className="p-4 md:p-5 overflow-y-auto max-h-[calc(92vh-165px)]">{formContent}</div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-4">
            <div className="modal-content w-full max-w-5xl rounded-lg border border-border bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Add several items at once</h2>
                        <p className="text-sm text-muted-foreground">Enter each item name, its quantity, and optional reference.</p>
                    </div>
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            resetState();
                            onClose();
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                {formContent}
            </div>
        </div>
    );
}
