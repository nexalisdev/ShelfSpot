import React, { useState, useEffect } from "react";
import { Archive, DoorOpen, Lamp, SquareLibrary, FolderOpen } from "lucide-react";
import { backendApi } from "@/lib/backend-api";

interface CreateObjectModalProps {
    open: boolean;
    onClose: () => void;
}

// Types for entities
interface Room { id: number; name: string; }
interface Place { id: number; name: string; roomId: number; }
interface Container { id: number; name: string; roomId: number; placeId: number; }

const objectTypes = [
    { key: "room", label: "Room", icon: <DoorOpen className="w-7 h-7 mb-2 text-blue-600 dark:text-blue-400" /> },
    { key: "place", label: "Place", icon: <SquareLibrary className="w-7 h-7 mb-2 text-blue-600 dark:text-blue-400" /> },
    { key: "container", label: "Container", icon: <Archive className="w-7 h-7 mb-2 text-blue-600 dark:text-blue-400" /> },
    { key: "item", label: "Item", icon: <Lamp className="w-7 h-7 mb-2 text-blue-600 dark:text-blue-400" /> },
    { key: "project", label: "Project", icon: <FolderOpen className="w-7 h-7 mb-2 text-blue-600 dark:text-blue-400" /> },
];

export default function CreateObjectModal({ open, onClose }: CreateObjectModalProps) {
    const [step, setStep] = useState<"select" | "form">("select");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Data states for dropdowns
    const [rooms, setRooms] = useState<Room[]>([]);
    const [places, setPlaces] = useState<Place[]>([]);
    const [containers, setContainers] = useState<Container[]>([]);

    // States for hierarchical selections
    const [selectedRoomForPlace, setSelectedRoomForPlace] = useState<number | null>(null);
    const [selectedRoomForContainer, setSelectedRoomForContainer] = useState<number | null>(null);
    const [selectedPlaceForContainer, setSelectedPlaceForContainer] = useState<number | null>(null);
    const [selectedRoomForItem, setSelectedRoomForItem] = useState<number | null>(null);
    const [selectedPlaceForItem, setSelectedPlaceForItem] = useState<number | null>(null);
    const [selectedContainerForItem, setSelectedContainerForItem] = useState<number | null>(null);

    // Fetch all data when modal opens
    const fetchAll = async () => {
        try {
            const [roomsData, placesData, containersData] = await Promise.all([
                backendApi.getRooms(),
                backendApi.getPlaces(),
                backendApi.getContainers(),
            ]);
            setRooms(roomsData);
            setPlaces(placesData);
            setContainers(containersData);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    useEffect(() => {
        if (open) {
            fetchAll();
        }
    }, [open]);

    if (!open) return null;

    const resetModal = () => {
        setStep("select");
        setSelectedType(null);
        setForm({});
        setError(null);
        setSuccess(false);
        setSelectedRoomForPlace(null);
        setSelectedRoomForContainer(null);
        setSelectedPlaceForContainer(null);
        setSelectedRoomForItem(null);
        setSelectedPlaceForItem(null);
        setSelectedContainerForItem(null);
    };

    const handleTypeSelect = (type: string) => {
        setSelectedType(type);
        setStep("form");
        // Initialize form with default values based on type
        if (type === "item") {
            setForm({ quantity: 1 }); // Set default quantity for items
        } else {
            setForm({}); // Reset form for other types
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const payload: Record<string, unknown> = { ...form };

            // Add relation IDs according to type
            if (selectedType === "place" && selectedRoomForPlace) {
                payload.roomId = selectedRoomForPlace;
            }
            if (selectedType === "container") {
                if (selectedRoomForContainer) payload.roomId = selectedRoomForContainer;
                if (selectedPlaceForContainer) payload.placeId = selectedPlaceForContainer;
            }
            if (selectedType === "item") {
                if (selectedRoomForItem) payload.roomId = selectedRoomForItem;
                if (selectedPlaceForItem) payload.placeId = selectedPlaceForItem;
                if (selectedContainerForItem) payload.containerId = selectedContainerForItem;
            }

            // Convert numeric values
            if (payload.quantity) payload.quantity = parseInt(String(payload.quantity));
            else if (selectedType === "item") payload.quantity = 1; // Default quantity for items
            if (payload.price) payload.price = parseFloat(String(payload.price));
            if (payload.sellprice) payload.sellprice = parseFloat(String(payload.sellprice));
            if (payload.roomId) payload.roomId = parseInt(String(payload.roomId));
            if (payload.placeId) payload.placeId = parseInt(String(payload.placeId));
            if (payload.containerId) payload.containerId = parseInt(String(payload.containerId));

            // Ensure boolean values are properly set
            if (selectedType === "item") {
                payload.consumable = Boolean(payload.consumable);
            }

            // Use the appropriate backend API method based on the selected type
            switch (selectedType) {
                case "room":
                    await backendApi.createRoom(payload);
                    break;
                case "place":
                    await backendApi.createPlace(payload);
                    break;
                case "container":
                    await backendApi.createContainer(payload);
                    break;
                case "item":
                    await backendApi.createItem(payload);
                    break;
                case "project":
                    await backendApi.createProject(payload as {
                        name: string;
                        description?: string;
                        status?: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
                        priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
                        startDate?: string;
                        endDate?: string;
                    });
                    break;
                default:
                    throw new Error(`Unknown type: ${selectedType}`);
            }

            setSuccess(true);
            setTimeout(() => {
                resetModal();
                onClose();
            }, 1000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 modal-backdrop p-4">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-sm shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative modal-content">
                <button
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10 w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 backdrop-blur-sm"
                    onClick={() => {
                        resetModal();
                        onClose();
                    }}
                    aria-label="Close"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {step === "select" && (
                    <div className="p-10">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 mb-4">
                                What would you like to add to your home?
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg">
                                Choose the type of item you want to create
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {objectTypes.map((type) => (
                                <div
                                    key={type.key}
                                    className="group border-2 border-gray-200/50 dark:border-gray-600/50 rounded-sm p-8 flex flex-col items-center hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm relative overflow-hidden"
                                    onClick={() => handleTypeSelect(type.key)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">{type.icon}</div>
                                        <span className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">{type.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === "form" && selectedType && (
                    <div className="p-10">
                        <div className="flex items-center mb-8">
                            <button
                                type="button"
                                onClick={() => setStep("select")}
                                className="mr-6 p-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-all duration-200 group"
                                aria-label="Back"
                            >
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex-1 text-center">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 mb-2">
                                    {selectedType === "room" && "How should this room be called?"}
                                    {selectedType === "place" && "How should this place be called?"}
                                    {selectedType === "container" && "How should this container be called?"}
                                    {selectedType === "item" && "How should this item be called?"}
                                    {selectedType === "project" && "How should this project be called?"}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Fill in the details below to create your {selectedType}
                                </p>
                            </div>
                            <div className="w-12"></div> {/* Spacer for centering */}
                        </div>
                        <div className="mb-8 flex flex-col items-center">
                            {objectTypes.find(t => t.key === selectedType)?.icon && (
                                <div className="rounded-sm p-8 mb-6 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
                                    <div className="text-blue-600 dark:text-blue-400 scale-150">{objectTypes.find(t => t.key === selectedType)?.icon}</div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* ROOM */}
                                {selectedType === "room" && (
                                    <div className="col-span-full">
                                        <label className="block">
                                            <span className="block mb-3 text-lg font-semibold text-gray-900 dark:text-white">Enter the name of the room</span>
                                            <input
                                                name="name"
                                                className="w-full px-4 py-4 border border-gray-200 dark:border-gray-600 rounded-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white text-lg placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g., Living Room, Kitchen, Bedroom..."
                                            />
                                        </label>
                                    </div>
                                )}

                                {/* PLACE */}
                                {selectedType === "place" && (
                                    <>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Room</span>
                                                <select
                                                    value={selectedRoomForPlace ?? ""}
                                                    onChange={e => setSelectedRoomForPlace(Number(e.target.value) || null)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                >
                                                    <option value="">Select a room</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id} value={room.id}>{room.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Place name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Place name"
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* CONTAINER */}
                                {selectedType === "container" && (
                                    <>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Room</span>
                                                <select
                                                    value={selectedRoomForContainer ?? ""}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || null;
                                                        setSelectedRoomForContainer(val);
                                                        setSelectedPlaceForContainer(null);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                >
                                                    <option value="">Select a room</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id} value={room.id}>{room.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Place</span>
                                                <select
                                                    value={selectedPlaceForContainer ?? ""}
                                                    onChange={e => setSelectedPlaceForContainer(Number(e.target.value) || null)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    disabled={!selectedRoomForContainer}
                                                >
                                                    <option value="">Select a place</option>
                                                    {places.filter(p => p.roomId === selectedRoomForContainer).map(place => (
                                                        <option key={place.id} value={place.id}>{place.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Container name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Container name"
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* ITEM */}
                                {selectedType === "item" && (
                                    <>
                                        {/* Item name - Full width */}
                                        <div className="col-span-full">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Item name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Item name"
                                                />
                                            </label>
                                        </div>

                                        {/* Status - Full width */}
                                        <div className="col-span-full">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Status (optional)</span>
                                                <input
                                                    name="status"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    placeholder="Status"
                                                />
                                            </label>
                                        </div>

                                        {/* Location row - 3 columns */}
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Room</span>
                                                <select
                                                    value={selectedRoomForItem ?? ""}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || null;
                                                        setSelectedRoomForItem(val);
                                                        setSelectedPlaceForItem(null);
                                                        setSelectedContainerForItem(null);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Select a room</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id} value={room.id}>{room.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Place (optional)</span>
                                                <select
                                                    value={selectedPlaceForItem ?? ""}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || null;
                                                        setSelectedPlaceForItem(val);
                                                        setSelectedContainerForItem(null);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={!selectedRoomForItem}
                                                >
                                                    <option value="">Select a place</option>
                                                    {places.filter(p => p.roomId === selectedRoomForItem).map(place => (
                                                        <option key={place.id} value={place.id}>{place.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Container (optional)</span>
                                                <select
                                                    value={selectedContainerForItem ?? ""}
                                                    onChange={e => setSelectedContainerForItem(Number(e.target.value) || null)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={!selectedPlaceForItem}
                                                >
                                                    <option value="">Select a container</option>
                                                    {containers.filter(c => c.placeId === selectedPlaceForItem).map(container => (
                                                        <option key={container.id} value={container.id}>{container.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        {/* Quantity, Price, Sell Price row - 3 columns */}
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Quantity</span>
                                                <input
                                                    name="quantity"
                                                    type="number"
                                                    min="1"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    value={String(form.quantity || 1)}
                                                    placeholder="1"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Price MSRP</span>
                                                <input
                                                    name="price"
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Sell Price (optional)</span>
                                                <input
                                                    name="sellprice"
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        </div>

                                        {/* Consumable checkbox - Full width */}
                                        <div className="col-span-full">
                                            <label className="flex items-center text-gray-900 dark:text-white">
                                                <input
                                                    name="consumable"
                                                    type="checkbox"
                                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    checked={Boolean(form.consumable)}
                                                    onChange={e => setForm({ ...form, consumable: e.target.checked })}
                                                />
                                                <span className="font-medium">Consumable Item</span>
                                            </label>
                                        </div>
                                    </>
                                )}

                                {/* PROJECT */}
                                {selectedType === "project" && (
                                    <>
                                        {/* Project name - Full width */}
                                        <div className="col-span-full">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Project name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Project name"
                                                />
                                            </label>
                                        </div>

                                        {/* Description - Full width */}
                                        <div className="col-span-full">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Description (optional)</span>
                                                <textarea
                                                    name="description"
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                    placeholder="Describe your project..."
                                                />
                                            </label>
                                        </div>

                                        {/* Status, Priority row - 2 columns */}
                                        <div className="col-span-2">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Status</span>
                                                <select
                                                    name="status"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                                    defaultValue="ACTIVE"
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="PAUSED">Paused</option>
                                                    <option value="COMPLETED">Completed</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Priority</span>
                                                <select
                                                    name="priority"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                                    defaultValue="MEDIUM"
                                                >
                                                    <option value="LOW">Low</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HIGH">High</option>
                                                    <option value="CRITICAL">Critical</option>
                                                </select>
                                            </label>
                                        </div>

                                        {/* Start Date, End Date row - 2 columns */}
                                        <div className="col-span-2">
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">Start Date (optional)</span>
                                                <input
                                                    name="startDate"
                                                    type="date"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-gray-900 dark:text-white">
                                                <span className="block mb-2 font-medium">End Date (optional)</span>
                                                <input
                                                    name="endDate"
                                                    type="date"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    onChange={handleChange}
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-center pt-8">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-sm px-12 py-4 text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:-translate-y-1 transform focus:ring-4 focus:ring-blue-300/50 dark:focus:ring-blue-800/50 backdrop-blur-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating...
                                        </div>
                                    ) : (
                                        `✨ Create ${objectTypes.find(t => t.key === selectedType)?.label}`
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm p-6 rounded-sm border border-red-200/50 dark:border-red-800/50 shadow-lg">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-red-500 text-lg">⚠️</span>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                </div>
                            )}
                            {success && (
                                <div className="text-green-600 dark:text-green-400 text-sm text-center bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm p-6 rounded-sm border border-green-200/50 dark:border-green-800/50 shadow-lg">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-green-500 text-lg">✅</span>
                                        <span className="font-medium">Successfully created!</span>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
