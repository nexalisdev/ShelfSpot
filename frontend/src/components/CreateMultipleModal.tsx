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

export default function CreateMultipleModal({ open, onClose }: Readonly<CreateMultipleModalProps>) {
    const [type, setType] = useState<ObjectType>("items");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/60 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-multiple-modal-title"
                className="w-full max-w-5xl rounded-xl bg-card shadow-2xl border border-border max-h-[92vh] flex flex-col"
            >
                {/* Header with Type Selection */}
                <div className="p-4 md:p-5 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 id="create-multiple-modal-title" className="text-xl md:text-2xl font-bold text-foreground">Create Multiple</h2>
                            <p className="text-sm text-muted-foreground">Choose type and add multiple entries at once</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Close modal"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-400 hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                            onClick={onClose}
                        >✕</button>
                    </div>

                    {/* Type Tabs */}
                    <div role="tablist" aria-label="Object type" className="flex flex-wrap gap-2">
                        <button
                            role="tab"
                            aria-selected={type === 'items'}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 ${type === 'items' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground hover:bg-muted/80'}`}
                            onClick={() => setType('items')}
                        >
                            Items
                        </button>
                        <button
                            role="tab"
                            aria-selected={type === 'containers'}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 ${type === 'containers' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground hover:bg-muted/80'}`}
                            onClick={() => setType('containers')}
                        >
                            Containers
                        </button>
                        <button
                            role="tab"
                            aria-selected={type === 'rooms'}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 ${type === 'rooms' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground hover:bg-muted/80'}`}
                            onClick={() => setType('rooms')}
                        >
                            Rooms
                        </button>
                        <button
                            role="tab"
                            aria-selected={type === 'places'}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 ${type === 'places' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground hover:bg-muted/80'}`}
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