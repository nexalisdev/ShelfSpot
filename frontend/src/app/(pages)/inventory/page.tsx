"use client";

import ItemsTable from "@/components/ItemsTable";

export default function InventoryPage() {
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-900/20 p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-sm"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-blue-400 dark:to-emerald-400">
                                Inventory
                            </h1>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            Browse and manage all items in your house
                        </p>
                    </div>
                </div>
            </div>

            {/* Modern Items Table Container */}
            <div className="rounded-sm p-8">
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
