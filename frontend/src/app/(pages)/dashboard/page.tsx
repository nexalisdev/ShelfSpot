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
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
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
        // Prendre les 5 plus récents (assumant qu'ils sont déjà triés)
        setRecentItems(itemsData.slice(0, 5));
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
    <div className="space-y-8">
      {/* Always show search bar, either in header or standalone */}
      {preferences?.showWelcomeHeader === false && (
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search for any item in your inventory..."
              className="w-full pl-12 pr-6 py-3 border border-gray-200 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all duration-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/*  Header with gradient background */}
      {preferences?.showWelcomeHeader !== false && (
        <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-purple-900/20 border border-gray-200/50 dark:border-gray-700/50 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          <div className="relative text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-blue-400">
                Welcome back{user?.name ? `, ${user.name}` : ''}!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
                Find your items quickly and manage your inventory efficiently
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search for any item in your inventory..."
                  className="w-full pl-12 pr-6 py-4 text-lg border border-gray-200 dark:border-gray-600 rounded-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-lg transition-all duration-200 hover:shadow-xl"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Stats Grid */}
      {stats && preferences?.showStatsCards !== false && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
          />
          <StatCard
            title="Rooms"
            value={stats.totalRooms}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
          />
          <StatCard
            title="Places"
            value={stats.totalPlaces}
            className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-800/20 border-sky-200/50 dark:border-sky-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
          />
          <StatCard
            title="Containers"
            value={stats.totalContainers}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-200/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
          />
          <StatCard
            title="Tags"
            value={stats.totalTags}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border-indigo-200/50 dark:border-indigo-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
          />
          <StatCard
            title="Consumables"
            value={stats.consumables}
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200/50 dark:border-red-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
          />
        </div>
      )}

      {/* Contenu principal */}
      {search ? (
        /* Search Results */
        <div className="space-y-8">
          {searchLoading ? (
            <div className="text-center py-16">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin opacity-20"></div>
                <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xl font-medium">Searching your inventory...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This won&apos;t take long</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No items found</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Try a different search term or check your spelling</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-sm border border-blue-200/50 dark:border-blue-700/50">
                  <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {searchResults.length} item{searchResults.length > 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((item: SearchItem) => (
                  <div
                    key={item.id}
                    className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-2"
                    onClick={() => {
                      router.push(`/manage/${item.id}`);
                      setSearch("");
                    }}
                  >
                    <div className="font-bold text-gray-900 dark:text-white text-xl mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                      <span className="text-base">
                        {item.room?.name || 'Unknown room'}
                        {item.place && ` • ${item.place.name}`}
                        {item.container && ` • ${item.container.name}`}
                      </span>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /*  Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Charts Section */}
          {(preferences?.showRoomDistribution !== false ||
            preferences?.showAlertsPerMonth !== false ||
            preferences?.showInventoryValue !== false ||
            preferences?.showStatusDistribution !== false) && (
              <div className={preferences?.showRecentItems !== false ? "lg:col-span-3" : "lg:col-span-5"}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-sm"></div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Analytics
                  </h2>
                </div>
                <div className="h-[690px]">
                  <DashboardCharts preferences={{
                    showRoomDistribution: preferences?.showRoomDistribution !== false,
                    showAlertsPerMonth: preferences?.showAlertsPerMonth !== false,
                    showInventoryValue: preferences?.showInventoryValue !== false,
                    showStatusDistribution: preferences?.showStatusDistribution !== false,
                  }} />
                </div>
              </div>
            )}

          {/* Recent Items - Modern Card */}
          {preferences?.showRecentItems !== false && (
            <div className="lg:col-span-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-sm p-8 mt-[52px] flex flex-col h-[725px] shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-sm"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Items
                </h2>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide relative" style={{ zIndex: 1 }}>
                {recentItems.length > 0 ? (
                  recentItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="group relative flex items-center justify-between p-4 rounded-sm bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 transform"
                      onClick={() => router.push(`/manage/${item.id}`)}
                      title={`Created: ${new Date(item.createdAt).toLocaleDateString()}${item.status ? ` • Status: ${item.status}` : ''}${item.quantity ? ` • Qty: ${item.quantity}` : ''}`}
                      style={{ zIndex: 10 + index }}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                          <span>
                            {item.room?.name || 'Unknown room'}
                            {item.place && ` • ${item.place.name}`}
                            {item.container && ` • ${item.container.name}`}
                          </span>
                        </div>
                      </div>

                      {/* Modern Tooltip */}
                      <div
                        className="absolute right-0 bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-72 p-4 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-sm shadow-2xl border border-gray-700 pointer-events-none"
                        style={{
                          zIndex: 9999,
                          transform: 'translateX(-20px)'
                        }}
                      >
                        <div className="space-y-2">
                          <div><strong className="text-blue-300">Created:</strong> {new Date(item.createdAt).toLocaleDateString()}</div>
                          {item.status && <div><strong className="text-green-300">Status:</strong> {item.status}</div>}
                          {item.quantity && <div><strong className="text-yellow-300">Quantity:</strong> {item.quantity}</div>}
                          <div><strong className="text-purple-300">Location:</strong></div>
                          <div className="ml-3 text-gray-300">
                            🏠 Room: {item.room?.name || 'Unknown'}
                            {item.place && <><br />📍 Place: {item.place.name}</>}
                            {item.container && <><br />📦 Container: {item.container.name}</>}
                          </div>
                          <div className="text-blue-300 mt-3 font-medium">✨ Click to view details</div>
                        </div>
                        {/* Modern Arrow */}
                        <div className="absolute top-full left-6 w-3 h-3 bg-gray-900/95 transform rotate-45 border-r border-b border-gray-700"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-sm flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No recent items
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Items you add will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, className }: { title: string; value: number; className?: string }) {
  return (
    <div className={`group relative p-6 rounded-sm border backdrop-blur-sm hover:-translate-y-1 transform transition-all duration-300 cursor-pointer ${className || 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:scale-105 transition-transform duration-200">
          {value}
        </p>
      </div>
      <div className="absolute inset-0 rounded-sm bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
