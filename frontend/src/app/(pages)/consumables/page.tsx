"use client";
import ItemsTable from "@/components/ItemsTable";
import useGetConsumables from "@/app/hooks/useGetConsumables";

export default function Consumables() {
  const { items, loading, error } = useGetConsumables();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="app-panel-elevated relative overflow-hidden px-6 py-8 md:px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-accent" />
          <h1 className="app-heading text-3xl font-bold text-foreground">Consumables</h1>
        </div>
        <p className="app-muted mt-2 text-lg leading-relaxed">
          Manage your consumable items and track their usage
        </p>
      </div>

      {/* Content */}
      <div className="">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading consumables...</div>
          </div>
        )}
        {error && (
          <div className="p-6">
            <div className="text-destructive">{error}</div>
          </div>
        )}
        {!loading && !error && items && items.length > 0 && (
          <div className="p-6">
            <ItemsTable items={items} />
          </div>
        )}
        {!loading && !error && items && items.length === 0 && (
          <div className="p-6">
            <div className="text-center text-muted-foreground">
              No consumables found. Create your first consumable item to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
