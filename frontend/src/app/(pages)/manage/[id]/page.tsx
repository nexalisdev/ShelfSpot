"use client"
import ManageObjectClient from "@/components/ManageObjectClient";
import AlertsManager from "@/components/AlertsManager";
import useGetItems from "@/app/hooks/useGetItems";
import { useParams } from "next/navigation";

export default function ManageObjectPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data, loading, error } = useGetItems(id);

    if (!id) {
        return (
            <main className="max-w-2xl mx-auto p-8 theme-bg">
                <h1 className="text-2xl font-bold mb-4">Missing parameter</h1>
                <p className="theme-muted">No ID provided.</p>
            </main>
        );
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error : {error}</div>;
    if (!data || Array.isArray(data)) return <div>No object found.</div>;

    const item = data;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{item.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        Item details and management
                    </p>
                </div>
            </div>

            {/* Item Details Card */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Item Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Quantity:</span>
                        <span className="text-foreground">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Status:</span>
                        <span className="text-foreground">{item.status || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Room:</span>
                        <span className="text-foreground">{item.room?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Place:</span>
                        <span className="text-foreground">{item.place?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Container:</span>
                        <span className="text-foreground">{item.container?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Tags:</span>
                        <span className="text-foreground">{item.tags && item.tags.length > 0 ? item.tags.join(", ") : "-"}</span>
                    </div>
                </div>
            </div>

            {/* Actions Card */}
            <div className="bg-card border border-border rounded-lg p-6">
                <ManageObjectClient item={item} />
            </div>

            {/* Quantity Alert Card */}
            <AlertsManager
                itemId={item.id}
                itemName={item.name}
                currentQuantity={item.quantity}
            />
        </div>
    );
}
