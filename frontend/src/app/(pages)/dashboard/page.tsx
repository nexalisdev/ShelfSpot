"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Package } from "lucide-react";
import DashboardCharts from "@/components/DashboardCharts";
import { backendApi } from "@/lib/backend-api";
import { useAuth } from "@/lib/auth-context";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";

// Types
interface Stats {
  totalItems: number;
  totalRooms: number;
  totalPlaces: number;
  totalContainers: number;
  totalTags: number;
  consumables: number;
}

interface RecentItem {
  id: number;
  name: string;
  createdAt: string;
  room?: { id: number; name: string };
  place?: { id: number; name: string };
  container?: { id: number; name: string };
  status?: string;
  quantity?: number;
}

interface SearchItem {
  id: number;
  name: string;
  room?: { id: number; name: string };
  place?: { id: number; name: string };
  container?: { id: number; name: string };
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { preferences } = useUserPreferences();
  const [stats] = useState<Stats | null>(null);
  const [allItems, setAllItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();

  // Rediriger vers login si pas authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Ne charger les données que si l'utilisateur est authentifié
    if (!user || authLoading) {
      console.log("Dashboard: User not authenticated yet", { user, authLoading });
      return;
    }

    console.log("Dashboard: Starting to fetch data for user:", user);

    const fetchData = async () => {
      try {
        console.log("Dashboard: Calling backendApi.getItems()");
        const itemsData = await backendApi.getItems();
        console.log("Dashboard: Received items data:", itemsData);
        // Prendre tous les objets au lieu de juste les 5 plus recents
        setAllItems(itemsData);
      } catch (error) {
        console.error("Dashboard: Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // Effect pour la recherche
  useEffect(() => {
    if (!search || !user) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const handler = setTimeout(async () => {
      try {
        const data = await backendApi.getItems(search);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search, user]);

  // Afficher loading pendant l'authentification
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Si pas authentifié, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Always show search bar, either in header or standalone */}
      {preferences?.showWelcomeHeader === false && (
        <div className="mx-auto max-w-2xl">
          <div className="app-panel-elevated relative p-3">
            {/* <Search className="pointer-events-none absolute top-1/2 left-7 h-5 w-5 -translate-y-1/2 text-muted-foreground" /> */}
            <input
              id="dashboard-search-inline"
              type="text"
              placeholder="Search for any item in your inventory..."
              className="app-input py-3 pr-4 pl-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/*  Header with gradient background */}
      {preferences?.showWelcomeHeader !== false && (
        <div className="app-panel-elevated relative overflow-hidden px-6 py-8 md:px-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-cyan-400/10" />
          <div className="relative text-center space-y-6">
            <div>
              <span className="app-kicker">Workspace overview</span>
              <h1 className="app-heading mt-4 text-3xl font-bold text-foreground md:text-4xl">
                Welcome back{user?.name ? `, ${user.name}` : ''}!
              </h1>
              <p className="app-muted mt-3 text-lg leading-relaxed">
                Find your items quickly and manage your inventory efficiently
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative group">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="dashboard-search-main"
                  type="text"
                  placeholder="Search for any item in your inventory..."
                  className="app-input py-3.5 pr-4 !pl-11 text-base md:text-lg"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Stats Grid */}
      {stats && preferences?.showStatsCards !== false && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Items" value={stats.totalItems} />
          <StatCard title="Rooms" value={stats.totalRooms} />
          <StatCard title="Places" value={stats.totalPlaces} />
          <StatCard title="Containers" value={stats.totalContainers} />
          <StatCard title="Tags" value={stats.totalTags} />
          <StatCard title="Consumables" value={stats.consumables} />
        </div>
      )}

      {/* Contenu principal */}
      {search ? (
        /* Search Results */
        <div className="space-y-8">
          {searchLoading ? (
            <div className="text-center py-16">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-600 rounded-full animate-spin opacity-20"></div>
                <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xl font-medium">Searching your inventory...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This won&apos;t take long</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No items found</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Try a different search term or check your spelling</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 rounded-full border border-border bg-secondary px-6 py-3">
                  <Search className="h-5 w-5 text-primary" />
                  <p className="text-lg font-semibold text-foreground">
                    {searchResults.length} item{searchResults.length > 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((item: SearchItem) => (
                  <button
                    key={item.id}
                    type="button"
                    className="app-panel group relative w-full cursor-pointer p-6 text-left transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                    onClick={() => {
                      router.push(`/manage/${item.id}`);
                      setSearch("");
                    }}
                  >
                    <div className="mb-4 text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                      {item.name}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-3 h-5 w-5 text-primary" />
                      <span className="text-base">
                        {item.room?.name || 'Unknown room'}
                        {item.place && ` • ${item.place.name}`}
                        {item.container && ` • ${item.container.name}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /*  Dashboard Layout */
        <div className="space-y-8">
          {/* All Items - Horizontal Slider */}
          <div className="app-panel-elevated p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-primary"></div>
                <h2 className="app-heading text-xl font-bold text-foreground">
                  All Items
                </h2>
              </div>
              <button
                onClick={() => router.push('/manage')}
                className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 rounded"
              >
                View all inventory &rarr;
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {allItems.length > 0 ? (
                allItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="app-panel-muted group relative flex w-72 flex-none cursor-pointer flex-col p-4 text-left transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                    onClick={() => router.push(`/manage/${item.id}`)}
                    style={{ scrollSnapAlign: 'start', zIndex: 10 + index }}
                  >
                    <p className="truncate text-lg font-semibold text-foreground" title={item.name}>
                      {item.name}
                    </p>
                    <div className="mt-2 flex items-center truncate text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="truncate">
                        {item.room?.name || 'Unknown room'}
                        {item.place && ` • ${item.place.name}`}
                        {item.container && ` • ${item.container.name}`}
                      </span>
                    </div>

                    {/* Modern Tooltip for details (optional if we want desktop hover info) */}
                    <div
                      className="app-panel pointer-events-none absolute bottom-full left-1/2 mb-4 hidden w-64 p-4 text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block"
                      style={{
                        zIndex: 9999,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="space-y-2">
                        <div><strong className="text-primary">Created:</strong> {new Date(item.createdAt).toLocaleDateString()}</div>
                        {item.status && <div><strong className="text-emerald-500">Status:</strong> {item.status}</div>}
                        {item.quantity && <div><strong className="text-amber-500">Quantity:</strong> {item.quantity}</div>}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="app-panel-muted w-full border border-dashed border-border py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-muted-foreground">
                    No items found
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/80">
                    Items you add will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {(preferences?.showRoomDistribution !== false ||
              preferences?.showAlertsPerMonth !== false ||
              preferences?.showInventoryValue !== false ||
              preferences?.showStatusDistribution !== false) && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1 rounded-full bg-primary"></div>
                    <h2 className="app-heading text-2xl font-bold text-foreground">
                      Analytics
                    </h2>
                  </div>
                  <div className="app-panel h-[2/3] p-4 md:p-5">
                    <DashboardCharts preferences={{
                      showRoomDistribution: preferences?.showRoomDistribution !== false,
                      showAlertsPerMonth: preferences?.showAlertsPerMonth !== false,
                      showInventoryValue: preferences?.showInventoryValue !== false,
                      showStatusDistribution: preferences?.showStatusDistribution !== false,
                    }} />
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, className }: { title: string; value: number; className?: string }) {
  return (
    <div className={`app-panel group relative p-5 transition-transform duration-150 hover:-translate-y-0.5 ${className || ""}`}>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground/85">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-foreground transition-transform duration-200 group-hover:scale-[1.02]">
          {value}
        </p>
      </div>
    </div>
  );
}

