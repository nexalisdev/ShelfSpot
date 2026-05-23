"use client";

import ItemsTable from "@/components/ItemsTable";

export default function InventoryPage() {
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="app-panel-elevated relative overflow-hidden px-6 py-8 md:px-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 rounded-full bg-accent" />
                    <h1 className="app-heading text-3xl font-bold text-foreground">Inventory</h1>
                </div>
                <p className="app-muted mt-2 text-lg leading-relaxed">
                    Browse and manage all items in your house
                </p>
            </div>

            {/* Items Table */}
            <div>
                <ItemsTable
                    columns={[
                        "name",
                        "quantity",
                        "status",
                        "room",
                        "place",
                        "container",
                        "tags",
                        "actions"
                    ]}
                    showCreateForm={false}
                />
            </div>
        </div>
    );
}
