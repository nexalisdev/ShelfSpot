'use client';
import { useState } from "react";
import { Item, Room, Place, Container } from "@/app/types";
import useGetRooms from "@/app/hooks/useGetRooms";
import useGetPlaces from "@/app/hooks/useGetPlaces";
import useGetContainers from "@/app/hooks/useGetContainers";
import { backendApi } from "@/lib/backend-api";

export default function ManageObjectClient({ item }: { item: Item }) {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<Partial<Item>>(item);
    const { data: rooms, loading: loadingRooms } = useGetRooms();
    const { data: places, loading: loadingPlaces } = useGetPlaces();
    const { data: containers, loading: loadingContainers } = useGetContainers();

    const filteredPlaces = form.roomId ? (places || []).filter((p: Place) => p.roomId === form.roomId) : (places || []);
    const filteredContainers = form.placeId
        ? (containers || []).filter((c: Container) => c.placeId === form.placeId)
        : (form.roomId ? (containers || []).filter((c: Container) => c.roomId === form.roomId) : (containers || []));

    const handleDelete = async () => {
        if (!window.confirm("Do you really want to delete this item? This action is irreversible.")) return;
        try {
            await backendApi.deleteItem(item.id);
            window.location.href = "/manage";
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Error deleting item");
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
            <div className="flex gap-4">
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                    Edit
                </button>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-full bg-destructive text-white font-medium hover:opacity-90 transition-opacity"
                >
                    Delete
                </button>
            </div>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">Edit item</h2>
                            <button
                                className="text-muted-foreground hover:text-foreground text-2xl rounded-lg px-2"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] p-4">
                            <form onSubmit={async e => {
                                e.preventDefault();
                                try {
                                    await backendApi.updateItem(item.id, form);
                                    setShowModal(false);
                                    window.location.reload();
                                } catch (error) {
                                    console.error("Error updating item:", error);
                                    alert("Error updating item");
                                }
                            }} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                                        <input
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.quantity}
                                            onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                                        <input
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.status || ""}
                                            onChange={e => setForm({ ...form, status: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Item Link</label>
                                        <input
                                            type="url"
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.itemLink || ""}
                                            onChange={e => setForm({ ...form, itemLink: e.target.value })}
                                            placeholder="https://example.com/item"
                                        />
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Purchase Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.price || ""}
                                            onChange={e => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Selling Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.sellprice || ""}
                                            onChange={e => setForm({ ...form, sellprice: e.target.value ? Number(e.target.value) : undefined })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Room</label>
                                        <select
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                            value={form.roomId ?? ""}
                                            onChange={e => {
                                                const roomId = Number(e.target.value) || undefined;
                                                setForm(f => ({ ...f, roomId, placeId: undefined, containerId: undefined }));
                                            }}
                                        >
                                            <option value="">Select a room</option>
                                            {loadingRooms ? <option>Loading...</option> : (rooms || []).map((room: Room) => (
                                                <option key={room.id} value={room.id}>{room.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Place</label>
                                        <select
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-50"
                                            value={form.placeId ?? ""}
                                            onChange={e => {
                                                const placeId = Number(e.target.value) || undefined;
                                                setForm(f => ({ ...f, placeId, containerId: undefined }));
                                            }}
                                            disabled={!form.roomId}
                                        >
                                            <option value="">Select a place</option>
                                            {loadingPlaces ? <option>Loading...</option> : filteredPlaces.map((place: Place) => (
                                                <option key={place.id} value={place.id}>{place.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Container</label>
                                        <select
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-50"
                                            value={form.containerId ?? ""}
                                            onChange={e => setForm(f => ({ ...f, containerId: Number(e.target.value) || undefined }))}
                                            disabled={!form.roomId && !form.placeId}
                                        >
                                            <option value="">Select a container</option>
                                            {loadingContainers ? <option>Loading...</option> : filteredContainers.map((container: Container) => (
                                                <option key={container.id} value={container.id}>{container.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Options and Tags */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Tags (Read-only)</label>
                                        <div className="max-h-24 overflow-y-auto border border-border rounded-lg p-2 bg-muted/40">
                                            {item.tags && item.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tags.map((tagName: string, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 text-xs rounded-full bg-accent/15 text-foreground border border-border"
                                                        >
                                                            {tagName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No tags assigned</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Tags cannot be modified in this form</p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer with buttons */}
                        <div className="flex justify-end gap-3 p-4 border-t border-border bg-muted/40">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-full border border-border text-muted-foreground hover:bg-muted/60 transition-colors"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const updateData = {
                                            name: form.name,
                                            quantity: form.quantity,
                                            status: form.status,
                                            itemLink: form.itemLink,
                                            price: form.price,
                                            sellprice: form.sellprice,
                                            roomId: form.roomId,
                                            placeId: form.placeId,
                                            containerId: form.containerId
                                        };

                                        Object.keys(updateData).forEach(key => {
                                            if (updateData[key as keyof typeof updateData] === undefined) {
                                                delete updateData[key as keyof typeof updateData];
                                            }
                                        });

                                        await backendApi.updateItem(item.id, updateData);
                                        setShowModal(false);
                                        window.location.reload();
                                    } catch (error) {
                                        console.error("Error updating item:", error);
                                        alert("Error updating item");
                                    }
                                }}
                                className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
