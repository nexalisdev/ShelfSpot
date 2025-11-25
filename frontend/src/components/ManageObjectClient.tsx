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
            <div className="flex gap-4">
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-sm transition-colors"
                >
                    Delete
                </button>
            </div>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit item</h2>
                            <button
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
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
                                    window.location.reload(); // Refresh to show updated data
                                } catch (error) {
                                    console.error("Error updating item:", error);
                                    alert("Error updating item");
                                }
                            }} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={form.quantity}
                                            onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={form.status || ""}
                                            onChange={e => setForm({ ...form, status: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Link</label>
                                        <input
                                            type="url"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={form.itemLink || ""}
                                            onChange={e => setForm({ ...form, itemLink: e.target.value })}
                                            placeholder="https://example.com/item"
                                        />
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={form.price || ""}
                                            onChange={e => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm   bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={form.sellprice || ""}
                                            onChange={e => setForm({ ...form, sellprice: e.target.value ? Number(e.target.value) : undefined })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Container</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Read-only)</label>
                                        <div className="max-h-24 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-sm p-2 bg-gray-50 dark:bg-gray-600">
                                            {item.tags && item.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tags.map((tagName: string, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-600"
                                                        >
                                                            {tagName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-sm">No tags assigned</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Tags cannot be modified in this form</p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer with buttons */}
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-sm transition-colors"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        // Filter out properties that shouldn't be sent to backend
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
                                            // Note: tags and consumable are excluded as they seem to be read-only or handled separately
                                        };

                                        // Remove undefined values
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
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors"
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
