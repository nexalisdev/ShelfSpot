"use client";
import ItemsTable from "@/components/ItemsTable";
import useGetFavourites from "@/app/hooks/useGetFavourites";

export default function Favourites() {
  const { favourites, loading, error } = useGetFavourites();
  const items = Array.isArray(favourites) ? favourites.map((fav) => fav.item) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="app-panel-elevated relative overflow-hidden px-6 py-8 md:px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-accent" />
          <h1 className="app-heading text-3xl font-bold text-foreground">Favorites</h1>
        </div>
        <p className="app-muted mt-2 text-lg leading-relaxed">
          Your favourite items for quick access
        </p>
      </div>

      {/* Content */}
      <div className="">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading favourites...</div>
          </div>
        )}
        {error && (
          <div className="p-6">
            <div className="text-destructive">{error}</div>
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
