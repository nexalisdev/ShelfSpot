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
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">Quantity Alerts</h2>
                <p className="text-muted-foreground">Loading alerts...</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Quantity Alerts</h2>
                <span className="text-sm text-muted-foreground">
                    Current: {currentQuantity}
                </span>
            </div>

            {alerts.length === 0 ? (
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        No quantity alerts configured for this object.
                    </p>
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                        >
                            Create Alert
                        </button>
                    ) : (
                        <form onSubmit={handleCreateAlert} className="space-y-4 p-4 bg-muted/40 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Alert Threshold
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newAlert.threshold}
                                    onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                    placeholder="e.g., 10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Alert Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                    placeholder="e.g., Low stock, Critical level"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewAlert({ threshold: '', name: '' });
                                    }}
                                    className="px-4 py-2 rounded-full border border-border text-muted-foreground hover:bg-muted/60 transition-colors"
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
                                    ? 'bg-accent/10 border-accent/30'
                                    : 'bg-muted/40 border-border'
                                    } ${currentQuantity <= alert.threshold && alert.isActive
                                        ? 'ring-2 ring-destructive/50'
                                        : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">
                                                Threshold: {alert.threshold}
                                            </span>
                                            {alert.name && (
                                                <span className="text-sm text-muted-foreground">
                                                    ({alert.name})
                                                </span>
                                            )}
                                            {currentQuantity <= alert.threshold && alert.isActive && (
                                                <span className="px-2 py-1 text-xs font-medium bg-destructive/15 text-destructive rounded-full">
                                                    TRIGGERED
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
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
                                            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${alert.isActive
                                                ? 'bg-muted text-muted-foreground hover:bg-muted/60'
                                                : 'bg-accent/15 text-accent hover:bg-accent/25'
                                                }`}
                                        >
                                            {alert.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAlert(alert.id)}
                                            className="px-3 py-1 text-sm font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 rounded-full transition-colors"
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
                            className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                        >
                            Add Another Alert
                        </button>
                    ) : (
                        <form onSubmit={handleCreateAlert} className="space-y-4 p-4 bg-muted/40 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Alert Threshold
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newAlert.threshold}
                                    onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                    placeholder="e.g., 10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Alert Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
                                    placeholder="e.g., Low stock, Critical level"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewAlert({ threshold: '', name: '' });
                                    }}
                                    className="px-4 py-2 rounded-full border border-border text-muted-foreground hover:bg-muted/60 transition-colors"
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
