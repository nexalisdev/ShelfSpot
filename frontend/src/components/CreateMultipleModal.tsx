"use client";

import React, { useState } from "react";
import CreateMultipleItemsModal from "@/components/CreateMultipleItemsModal";
import CreateMultipleRoomsModal from "@/components/CreateMultipleRoomsModal";
import CreateMultiplePlacesModal from "@/components/CreateMultiplePlacesModal";
import CreateMultipleContainersModal from "@/components/CreateMultipleContainersModal";

type ObjectType = "items" | "rooms" | "places" | "containers";

interface CreateMultipleModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateMultipleModal({ open, onClose }: CreateMultipleModalProps) {
    const [type, setType] = useState<ObjectType>("items");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 p-4">
            <div className="w-full max-w-4xl rounded-sm bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col">
                {/* Header with Type Selection */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Multiple</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Choose type and add multiple entries at once</p>
                        </div>
                        <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
                    </div>

                    {/* Type Tabs */}
                    <div className="flex gap-2">
                        <button
                            className={`px-4 py-2 rounded-sm font-medium transition-all ${type === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            onClick={() => setType('items')}
                        >
                            Items
                        </button>
                        <button
                            className={`px-4 py-2 rounded-sm font-medium transition-all ${type === 'containers' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            onClick={() => setType('containers')}
                        >
                            Containers
                        </button>
                        <button
                            className={`px-4 py-2 rounded-sm font-medium transition-all ${type === 'rooms' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            onClick={() => setType('rooms')}
                        >
                            Rooms
                        </button>
                        <button
                            className={`px-4 py-2 rounded-sm font-medium transition-all ${type === 'places' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            onClick={() => setType('places')}
                        >
                            Places
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                    {type === 'items' && <CreateMultipleItemsModal open={true} onClose={onClose} embedded={true} />}
                    {type === 'containers' && <CreateMultipleContainersModal open={true} onClose={onClose} embedded={true} />}
                    {type === 'rooms' && <CreateMultipleRoomsModal open={true} onClose={onClose} embedded={true} />}
                    {type === 'places' && <CreateMultiplePlacesModal open={true} onClose={onClose} embedded={true} />}
                </div>
            </div>
        </div>
    );
}