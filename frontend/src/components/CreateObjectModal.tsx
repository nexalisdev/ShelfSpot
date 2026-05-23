import React, { useState, useEffect } from "react";
import { Archive, DoorOpen, Lamp, SquareLibrary } from "lucide-react";
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
    { key: "room", label: "Room", icon: <DoorOpen className="w-7 h-7 mb-2 text-primary" /> },
    { key: "place", label: "Place", icon: <SquareLibrary className="w-7 h-7 mb-2 text-primary" /> },
    { key: "container", label: "Container", icon: <Archive className="w-7 h-7 mb-2 text-primary" /> },
    { key: "item", label: "Item", icon: <Lamp className="w-7 h-7 mb-2 text-primary" /> },
];

export default function CreateObjectModal({ open, onClose }: Readonly<CreateObjectModalProps>) {
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/60 modal-backdrop p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-object-modal-title"
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative modal-content"
            >
                <button
                    className="absolute top-6 right-6 text-muted-foreground hover:text-foreground z-10 h-11 w-11 flex items-center justify-center rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
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
                            <h2 id="create-object-modal-title" className="app-heading text-3xl font-bold text-foreground mb-4">
                                What would you like to add to your home?
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Choose the type of item you want to create
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {objectTypes.map((type) => (
                                <button
                                    key={type.key}
                                    type="button"
                                    className="group app-panel rounded-lg p-8 flex flex-col items-center hover:border-accent hover:-translate-y-1 transition-all duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                                    onClick={() => handleTypeSelect(type.key)}
                                >
                                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">{type.icon}</div>
                                        <span className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors text-center">{type.label}</span>
                                    </div>
                                </button>
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
                                className="mr-6 p-3 rounded-lg hover:bg-muted/40 transition-colors group"
                                aria-label="Back"
                            >
                                <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex-1 text-center">
                                <h2 className="app-heading text-3xl font-bold text-foreground mb-2">
                                    {selectedType === "room" && "How should this room be called?"}
                                    {selectedType === "place" && "How should this place be called?"}
                                    {selectedType === "container" && "How should this container be called?"}
                                    {selectedType === "item" && "How should this item be called?"}
                                </h2>
                                <p className="text-muted-foreground">
                                    Fill in the details below to create your {selectedType}
                                </p>
                            </div>
                            <div className="w-12"></div> {/* Spacer for centering */}
                        </div>
                        <div className="mb-8 flex flex-col items-center">
                            {objectTypes.find(t => t.key === selectedType)?.icon && (
                                <div className="app-panel rounded-lg p-8 mb-6 flex items-center justify-center">
                                    <div className="text-primary scale-150">{objectTypes.find(t => t.key === selectedType)?.icon}</div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* ROOM */}
                                {selectedType === "room" && (
                                    <div className="col-span-full">
                                        <label className="block">
                                            <span className="block mb-3 text-lg font-semibold text-foreground">Enter the name of the room</span>
                                            <input
                                                name="name"
                                                className="w-full px-4 py-4 border border-border rounded-lg bg-card text-foreground text-lg placeholder-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-ring transition-colors"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Room</span>
                                                <select
                                                    value={selectedRoomForPlace ?? ""}
                                                    onChange={e => setSelectedRoomForPlace(Number(e.target.value) || null)}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Place name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Room</span>
                                                <select
                                                    value={selectedRoomForContainer ?? ""}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || null;
                                                        setSelectedRoomForContainer(val);
                                                        setSelectedPlaceForContainer(null);
                                                    }}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Place</span>
                                                <select
                                                    value={selectedPlaceForContainer ?? ""}
                                                    onChange={e => setSelectedPlaceForContainer(Number(e.target.value) || null)}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Container name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Item name</span>
                                                <input
                                                    name="name"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Item name"
                                                />
                                            </label>
                                        </div>

                                        {/* Status - Full width */}
                                        <div className="col-span-full">
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Status (optional)</span>
                                                <input
                                                    name="status"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                                                    onChange={handleChange}
                                                    placeholder="Status"
                                                />
                                            </label>
                                        </div>

                                        {/* Location row - 3 columns */}
                                        <div>
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Room</span>
                                                <select
                                                    value={selectedRoomForItem ?? ""}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || null;
                                                        setSelectedRoomForItem(val);
                                                        setSelectedPlaceForItem(null);
                                                        setSelectedContainerForItem(null);
                                                    }}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                                                >
                                                    <option value="">Select a room</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id} value={room.id}>{room.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Place (optional)</span>
                                                <select
                                                    value={selectedPlaceForItem ?? ""}
                                                    onChange={e => {
                                                        const val = Number(e.target.value) || null;
                                                        setSelectedPlaceForItem(val);
                                                        setSelectedContainerForItem(null);
                                                    }}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Container (optional)</span>
                                                <select
                                                    value={selectedContainerForItem ?? ""}
                                                    onChange={e => setSelectedContainerForItem(Number(e.target.value) || null)}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
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
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Quantity</span>
                                                <input
                                                    name="quantity"
                                                    type="number"
                                                    min="1"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                                                    onChange={handleChange}
                                                    value={String(form.quantity || 1)}
                                                    placeholder="1"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Price MSRP</span>
                                                <input
                                                    name="price"
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-foreground">
                                                <span className="block mb-2 font-medium">Sell Price (optional)</span>
                                                <input
                                                    name="sellprice"
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-transparent"
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        </div>

                                        {/* Consumable checkbox - Full width */}
                                        <div className="col-span-full">
                                            <label className="flex items-center text-foreground">
                                                <input
                                                    name="consumable"
                                                    type="checkbox"
                                                    className="mr-2 h-4 w-4 accent-accent border-border rounded"
                                                    checked={Boolean(form.consumable)}
                                                    onChange={e => setForm({ ...form, consumable: e.target.checked })}
                                                />
                                                <span className="font-medium">Consumable Item</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-center pt-8">
                                <button
                                    type="submit"
                                    className="rounded-full bg-primary text-primary-foreground font-bold px-12 py-4 text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring/80"
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
                                <div className="text-destructive text-sm text-center bg-destructive/10 p-6 rounded-lg border border-destructive/30">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-lg">⚠️</span>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                </div>
                            )}
                            {success && (
                                <div className="text-accent text-sm text-center bg-accent/10 p-6 rounded-lg border border-accent/30">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-lg">✅</span>
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
