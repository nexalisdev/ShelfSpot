import { useState, useEffect } from "react";
import { backendApi } from "@/lib/backend-api";

export interface UserPreferences {
  id: number;
  userId: number;
  showWelcomeHeader: boolean;
  showStatsCards: boolean;
  showRecentItems: boolean;
  showRoomDistribution: boolean;
  showAlertsPerMonth: boolean;
  showInventoryValue: boolean;
  showStatusDistribution: boolean;
  preferredLanguage: string;
}

export interface UpdatePreferencesData {
  showWelcomeHeader?: boolean;
  showStatsCards?: boolean;
  showRecentItems?: boolean;
  showRoomDistribution?: boolean;
  showAlertsPerMonth?: boolean;
  showInventoryValue?: boolean;
  showStatusDistribution?: boolean;
  preferredLanguage?: string;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await backendApi.getUserPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch preferences"
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: UpdatePreferencesData) => {
    try {
      setError(null);
      const updatedPrefs = await backendApi.updateUserPreferences(updates);
      setPreferences(updatedPrefs);
      return updatedPrefs;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update preferences"
      );
      throw err;
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
