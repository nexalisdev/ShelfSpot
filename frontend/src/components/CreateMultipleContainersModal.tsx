"use client";

import React, { useMemo, useState, useEffect } from "react";
import { backendApi } from "@/lib/backend-api";

interface CreateMultipleContainersModalProps {
    open: boolean;
    onClose: () => void;
    embedded?: boolean;
}

interface BulkContainerRow {
    id: string;
    name: string;
    icon?: string;
    roomId?: number | null;
    placeId?: number | null;
}

interface Room { id: number; name: string; }
interface Place { id: number; name: string; roomId?: number | null }

const createEmptyRow = (): BulkContainerRow => ({
    id: `${Date.now()}-${Math.random()}`,
    name: "",
    icon: "",
    roomId: null,
    placeId: null,
});

export default function CreateMultipleContainersModal({ open, onClose, embedded = false }: CreateMultipleContainersModalProps) {
    const [rows, setRows] = useState<BulkContainerRow[]>([createEmptyRow()]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => { if (open) { backendApi.getRooms().then(setRooms).catch(() => { }); backendApi.getPlaces().then(setPlaces).catch(() => { }); } }, [open]);

    const canSubmit = useMemo(
        () => rows.every((r) => Boolean(r.name.trim())),
        [rows]
    );

    const handleChange = (id: string, field: keyof BulkContainerRow, value: string | number | null) => {
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: field === 'roomId' || field === 'placeId' ? (value === null ? null : Number(value)) : value } : r));
    };

    const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
    const removeRow = (id: string) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

    const resetState = () => { setRows([createEmptyRow()]); setLoading(false); setError(null); setSuccess(false); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (!canSubmit) { setError("Each line must have a name."); setLoading(false); return; }
        try {
            const payload = rows.map(r => ({ name: r.name, icon: r.icon || undefined, roomId: r.roomId || undefined, placeId: r.placeId || undefined }));
            await backendApi.createBulkContainers(payload);
            setSuccess(true);
            setTimeout(() => { resetState(); onClose(); }, 700);
        } catch (err) { setError(err instanceof Error ? err.message : String(err)); } finally { setLoading(false); }
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
                            <label className="col-span-12 text-sm text-foreground md:col-span-4">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Container name</span>
                                <input className="app-input py-2" value={row.name} onChange={(e) => handleChange(row.id, "name", e.target.value)} placeholder="e.g., Storage Box" required />
                            </label>

                            <label className="col-span-12 text-sm text-foreground md:col-span-2">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Icon (optional)</span>
                                <input className="app-input py-2" value={row.icon} onChange={(e) => handleChange(row.id, "icon", e.target.value)} placeholder="icon" />
                            </label>

                            <label className="col-span-6 text-sm text-foreground md:col-span-3">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Room (optional)</span>
                                <select className="app-input py-2" value={row.roomId ?? ""} onChange={(e) => handleChange(row.id, "roomId", e.target.value ? Number(e.target.value) : null)}>
                                    <option value="">None</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </label>

                            <label className="col-span-6 text-sm text-foreground md:col-span-3">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Place (optional)</span>
                                <select className="app-input py-2" value={row.placeId ?? ""} onChange={(e) => handleChange(row.id, "placeId", e.target.value ? Number(e.target.value) : null)}>
                                    <option value="">None</option>
                                    {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">Containers created successfully.</p>}

            <div className="flex flex-wrap gap-2.5">
                <button type="button" className="rounded-md border border-dashed px-3 py-1.5 text-sm font-semibold" onClick={addRow}>Add another line</button>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => { resetState(); onClose(); }}>Cancel</button>
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white" disabled={loading || !canSubmit}>{loading ? "Preparing…" : "Bulk create containers"}</button>
            </div>
        </form>
    );

    if (embedded) {
        return <div className="p-4 md:p-5 overflow-y-auto max-h-[calc(92vh-165px)]">{formContent}</div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-4">
            <div className="modal-content w-full max-w-5xl rounded-sm border border-gray-200/50 bg-white/95 p-6 shadow-2xl dark:border-gray-700/50 dark:bg-gray-900/95">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create multiple containers</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Add several containers at once (name required). Optionally link to a room/place.</p>
                    </div>
                    <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => { resetState(); onClose(); }}>✕</button>
                </div>
                {formContent}
            </div>
        </div>
    );
}
