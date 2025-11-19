"use client";
import ItemsTable from "@/components/ItemsTable";
import useGetConsumables from "@/app/hooks/useGetConsumables";

export default function Consumables() {
  const { items, loading, error } = useGetConsumables();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consumables</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your consumable items and track their usage
        </p>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading consumables...</div>
          </div>
        )}
        {error && (
          <div className="p-6">
            <div className="text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}
        {!loading && !error && items && items.length > 0 && (
          <div className="p-6">
            <ItemsTable items={items} />
          </div>
        )}
        {!loading && !error && items && items.length === 0 && (
          <div className="p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              No consumables found. Create your first consumable item to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
