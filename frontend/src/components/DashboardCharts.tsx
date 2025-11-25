import React from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
    Chart,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";
import useGetRooms from "@/app/hooks/useGetRooms";
import { useInventoryValue } from "@/app/hooks/useInventoryValue";
import { useAlertsStatistics } from "@/app/hooks/useAlertsStatistics";
import { useStatusStatistics } from "@/app/hooks/useStatusStatistics";
import { Room } from "@/app/types";
import { useTranslation } from "react-i18next";

// Extended type to include _count
type RoomWithCount = Room & {
    _count?: {
        items?: number;
    };
};

interface DashboardChartsProps {
    preferences?: {
        showRoomDistribution: boolean;
        showAlertsPerMonth: boolean;
        showInventoryValue: boolean;
        showStatusDistribution: boolean;
    };
}

Chart.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

const backgroundColors = [
    "#3b82f6",
    "#1d4ed8",
    "#1e40af",
    "#1e3a8a"
]

export default function DashboardCharts({ preferences }: DashboardChartsProps) {
    const { t } = useTranslation();
    const { data: rooms, loading, error } = useGetRooms();
    const { data: inventoryValueData, loading: inventoryLoading } = useInventoryValue();
    const { data: alertsData, loading: alertsLoading, error: alertsError } = useAlertsStatistics();
    const { data: statusData, loading: statusLoading, error: statusError } = useStatusStatistics();

    // Cast to RoomWithCount to access _count
    const roomsWithCount = rooms as RoomWithCount[];

    // Filter rooms that have items for the chart
    const roomsWithItems = roomsWithCount?.filter((room) =>
        room._count?.items && room._count.items > 0) || [];

    const filteredRoomDistribution = {
        labels: roomsWithItems.map((room) => room.name),
        datasets: [{
            data: roomsWithItems.map((room) => room._count?.items || 0),
            backgroundColor: backgroundColors,
            borderWidth: 1,
        }],
    };

    // Generate alerts per month chart data
    const alertsPerMonth = alertsData ? {
        labels: alertsData.data.map(item => item.month),
        datasets: [
            {
                label: t('page.dashboard.charts.alerts'),
                data: alertsData.data.map(item => item.count),
                backgroundColor: "#3b82f6",
                borderColor: "#1e3a8a",
            },
        ],
    } : {
        labels: [],
        datasets: [
            {
                label: t('page.dashboard.charts.alerts'),
                data: [],
                backgroundColor: "#3b82f6",
                borderColor: "#1e3a8a",
            },
        ],
    };

    const statusDistribution = statusData ? {
        labels: statusData.data.map(item => item.status),
        datasets: [
            {
                label: t('page.dashboard.charts.itemsByStatus'),
                data: statusData.data.map(item => item.count),
                backgroundColor: backgroundColors,
                borderWidth: 1,
            },
        ],
    } : {
        labels: [],
        datasets: [
            {
                label: t('page.dashboard.charts.itemsByStatus'),
                data: [],
                backgroundColor: backgroundColors,
                borderWidth: 1,
            },
        ],
    };

    const currentValue = inventoryValueData?.totalValue || 0;

    const inventoryValue = {
        labels: [t('page.dashboard.charts.months.jan'), t('page.dashboard.charts.months.feb'), t('page.dashboard.charts.months.mar'), t('page.dashboard.charts.months.apr'), t('page.dashboard.charts.months.may')],
        datasets: [
            {
                label: t('page.dashboard.charts.valueEuro'),
                data: [currentValue, currentValue, currentValue, currentValue, currentValue],
                fill: true,
                backgroundColor: "#3b82f6",
                borderColor: "#1e3a8a",
            },
        ],
    };

    // Default preferences if not provided
    const chartPrefs = preferences || {
        showRoomDistribution: true,
        showAlertsPerMonth: true,
        showInventoryValue: true,
        showStatusDistribution: true,
    };

    // Filter charts based on preferences
    const visibleCharts = [];

    if (chartPrefs.showRoomDistribution) {
        visibleCharts.push('roomDistribution');
    }
    if (chartPrefs.showAlertsPerMonth) {
        visibleCharts.push('alertsPerMonth');
    }
    if (chartPrefs.showInventoryValue) {
        visibleCharts.push('inventoryValue');
    }
    if (chartPrefs.showStatusDistribution) {
        visibleCharts.push('statusDistribution');
    }

    // Calculate grid columns based on visible charts
    const getGridCols = () => {
        const count = visibleCharts.length;
        if (count === 0) return 'grid-cols-1';
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-1 md:grid-cols-2';
        if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        return 'grid-cols-1 md:grid-cols-2';
    };

    if (visibleCharts.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">📊</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.noChartsEnabled')}</div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">{t('page.dashboard.charts.enableChartsMessage')}</div>
            </div>
        );
    }

    return (
        <div className={`grid ${getGridCols()} gap-6 mt-6`}>
            {/* Modern Card 1: Distribution by room */}
            {chartPrefs.showRoomDistribution && (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-sm p-8 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                        <h2 className="text-gray-900 dark:text-white text-xl font-bold">{t('page.dashboard.charts.distributionByRoom')}</h2>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-xl"></div>
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('page.dashboard.charts.loadingRoomData')}</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-sm flex items-center justify-center">
                                <span className="text-red-500 text-2xl">⚠️</span>
                            </div>
                            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.errorLoadingRooms')}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">{error}</div>
                        </div>
                    ) : !rooms || rooms.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
                                <span className="text-gray-400 text-2xl">🏠</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.noRoomsFound')}</div>
                            <div className="text-gray-500 dark:text-gray-500 text-sm">{t('page.dashboard.charts.createFirstRoom')}</div>
                        </div>
                    ) : roomsWithItems.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
                                <span className="text-blue-500 text-2xl">📦</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.noItemsFound')}</div>
                            <div className="text-gray-500 dark:text-gray-500 text-sm">{t('page.dashboard.charts.addItemsToSeeDistribution')}</div>
                        </div>
                    ) : (
                        <div className="w-full h-64 flex justify-center">
                            <Pie
                                data={filteredRoomDistribution}
                                options={{
                                    maintainAspectRatio: false,
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'bottom' as const,
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    const label = context.label || '';
                                                    const value = context.parsed || 0;
                                                    return `${label}: ${value} ${t('page.dashboard.charts.items')}`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Modern Card 2: Alerts per month */}
            {chartPrefs.showAlertsPerMonth && (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-sm p-8 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                        <h2 className="text-gray-900 dark:text-white text-xl font-bold">{t('page.dashboard.charts.alertsPerMonth')}</h2>
                    </div>
                    {alertsLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 border-4 border-orange-100 dark:border-orange-900/30 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('page.dashboard.charts.loadingAlertsData')}</p>
                        </div>
                    ) : alertsError ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-sm flex items-center justify-center">
                                <span className="text-red-500 text-2xl">⚠️</span>
                            </div>
                            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.errorLoadingAlerts')}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">{alertsError}</div>
                        </div>
                    ) : !alertsData || alertsData.data.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-sm flex items-center justify-center">
                                <span className="text-orange-500 text-2xl">🚨</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.noAlertsData')}</div>
                            <div className="text-gray-500 dark:text-gray-500 text-sm">{t('page.dashboard.charts.noAlertsCreated')}</div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 text-center">
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                    {alertsData.total}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('page.dashboard.charts.totalAlertsLast12Months')}
                                </div>
                            </div>
                            <div className="w-full h-48">
                                <Bar data={alertsPerMonth} options={{ maintainAspectRatio: false }} />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Modern Card 3: Inventory value */}
            {chartPrefs.showInventoryValue && (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-sm p-8 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-teal-500 rounded-sm"></div>
                        <h2 className="text-gray-900 dark:text-white text-xl font-bold">{t('page.dashboard.charts.inventoryValue')}</h2>
                    </div>
                    {inventoryLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 border-4 border-green-100 dark:border-green-900/30 rounded-sm"></div>
                                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-sm animate-spin absolute top-0"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('page.dashboard.charts.calculatingInventoryValue')}</p>
                        </div>
                    ) : inventoryValueData ? (
                        <>
                            <div className="mb-4 text-center">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    €{inventoryValueData.totalValue.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('page.dashboard.charts.basedOnItems', { count: inventoryValueData.itemsWithValue })}
                                </div>
                            </div>
                            <div className="w-full h-48">
                                <Line data={inventoryValue} options={{ maintainAspectRatio: false }} />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
                                <span className="text-gray-400 text-2xl">💰</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.noInventoryValueData')}</div>
                            <div className="text-gray-500 dark:text-gray-500 text-sm">{t('page.dashboard.charts.addSellingPrices')}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Modern Card 4: Status distribution */}
            {chartPrefs.showStatusDistribution && (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-sm p-8 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-sm"></div>
                        <h2 className="text-gray-900 dark:text-white text-xl font-bold">{t('page.dashboard.charts.statusDistribution')}</h2>
                    </div>
                    {statusLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 border-4 border-purple-100 dark:border-purple-900/30 rounded-sm"></div>
                                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-sm animate-spin absolute top-0"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('page.dashboard.charts.loadingStatusData')}</p>
                        </div>
                    ) : statusError ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-sm flex items-center justify-center">
                                <span className="text-red-500 text-2xl">⚠️</span>
                            </div>
                            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.errorLoadingStatusData')}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">{statusError}</div>
                        </div>
                    ) : statusData && statusData.data.length > 0 ? (
                        <div className="w-full h-64">
                            <Bar data={statusDistribution} options={{ maintainAspectRatio: false }} />
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
                                <span className="text-gray-400 text-2xl">📊</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">{t('page.dashboard.charts.noStatusData')}</div>
                            <div className="text-gray-500 dark:text-gray-500 text-sm">{t('page.dashboard.charts.addStatusToItems')}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
