"use client";
import ItemsTable from "@/components/ItemsTable";
import useGetFavourites from "@/app/hooks/useGetFavourites";

export default function Favourites() {
  const { favourites, loading, error } = useGetFavourites();
  const items = Array.isArray(favourites) ? favourites.map((fav) => fav.item) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favourites</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Your favorite items for quick access
        </p>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading favourites...</div>
          </div>
        )}
        {error && (
          <div className="p-6">
            <div className="text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}
        {!loading && !error && (
          <div className="p-6">
            <ItemsTable items={items} />
          </div>
        )}
      </div>
    </div>
  );
}
