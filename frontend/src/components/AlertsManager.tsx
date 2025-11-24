"use client";
import { useState, useEffect } from "react";
import { Alert } from "@/app/types";
import { backendApi } from "@/lib/backend-api";

interface AlertsManagerProps {
    itemId: number;
    itemName: string;
    currentQuantity: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AlertsManager({ itemId, itemName, currentQuantity }: AlertsManagerProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newAlert, setNewAlert] = useState({
        threshold: '',
        name: ''
    });

    // Fetch alerts for this item
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await backendApi.getAlerts(itemId);
                setAlerts(data);
            } catch (error) {
                console.error('Error fetching alerts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, [itemId]);

    const handleCreateAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlert.threshold) return;

        try {
            const createdAlert = await backendApi.createAlert({
                itemId,
                threshold: parseInt(newAlert.threshold),
                name: newAlert.name || undefined,
            });
            setAlerts([...alerts, createdAlert]);
            setNewAlert({ threshold: '', name: '' });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating alert:', error);
        }
    };

    const handleDeleteAlert = async (alertId: number) => {
        if (!window.confirm("Do you really want to delete this alert?")) return;

        try {
            await backendApi.deleteAlert(alertId);
            setAlerts(alerts.filter(alert => alert.id !== alertId));
        } catch (error) {
            console.error('Error deleting alert:', error);
        }
    };

    const toggleAlert = async (alertId: number, isActive: boolean) => {
        try {
            await backendApi.updateAlert(alertId, { isActive: !isActive });
            setAlerts(alerts.map(alert =>
                alert.id === alertId ? { ...alert, isActive: !isActive } : alert
            ));
        } catch (error) {
            console.error('Error updating alert:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quantity Alerts</h2>
                <p className="text-gray-600 dark:text-gray-400">Loading alerts...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quantity Alerts</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Current: {currentQuantity}
                </span>
            </div>

            {alerts.length === 0 ? (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        No quantity alerts configured for this object.
                    </p>
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors"
                        >
                            Create Alert
                        </button>
                    ) : (
                        <form onSubmit={handleCreateAlert} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-sm">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Alert Threshold
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newAlert.threshold}
                                    onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Alert Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Low stock, Critical level"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-sm transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewAlert({ threshold: '', name: '' });
                                    }}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Existing alerts */}
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-lg border ${alert.isActive
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                    } ${currentQuantity <= alert.threshold && alert.isActive
                                        ? 'ring-2 ring-red-500 ring-opacity-50'
                                        : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                Threshold: {alert.threshold}
                                            </span>
                                            {alert.name && (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    ({alert.name})
                                                </span>
                                            )}
                                            {currentQuantity <= alert.threshold && alert.isActive && (
                                                <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                                                    TRIGGERED
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Status: {alert.isActive ? 'Active' : 'Inactive'}
                                            {alert.lastSent && (
                                                <span className="ml-2">
                                                    Last sent: {new Date(alert.lastSent).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAlert(alert.id, alert.isActive)}
                                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${alert.isActive
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                }`}
                                        >
                                            {alert.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAlert(alert.id)}
                                            className="px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add new alert button */}
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm transition-colors"
                        >
                            Add Another Alert
                        </button>
                    ) : (
                        <form onSubmit={handleCreateAlert} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-sm">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Alert Threshold
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newAlert.threshold}
                                    onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Alert Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Low stock, Critical level"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-sm transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewAlert({ threshold: '', name: '' });
                                    }}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
