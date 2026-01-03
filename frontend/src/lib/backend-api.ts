/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// API service to communicate with the NestJS backend

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class BackendApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "BackendApiError";
  }
}

class BackendApiService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("access_token");
    if (token) {
      console.log("BackendAPI: Using token:", token.substring(0, 50) + "...");
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("BackendAPI: No token found");
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    const headers = this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If we cannot parse the error response, keep the default message
      }
      throw new BackendApiError(response.status, errorMessage);
    }

    // Fix: Don't parse JSON if status is 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request<{ access_token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name?: string) {
    return this.request<{ access_token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getProfile() {
    return this.request<any>("/auth/profile");
  }

  async updateProfile(name: string) {
    return this.request<any>("/auth/profile/name", {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  }

  async updateProfileEmail(email: string) {
    return this.request<any>("/auth/profile/email", {
      method: "PUT",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, newPassword: string) {
    return this.request<{ message: string }>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Items methods
  async getItems(search?: string) {
    const searchParam = search ? `?q=${encodeURIComponent(search)}` : "";
    return this.request<any[]>(`/items/search${searchParam}`);
  }

  async getItem(id: number) {
    return this.request<any>(`/items/${id}`);
  }

  async createItem(data: any) {
    return this.request<any>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createBulkItems(items: any[]) {
    return this.request<any>("/items/bulk", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  async updateItem(id: number, data: any) {
    return this.request<any>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getInventoryValue() {
    return this.request<{
      totalValue: number;
      itemsWithValue: number;
      totalItems: number;
    }>("/items/inventory-value");
  }

  async deleteItem(id: number) {
    return this.request<{ message: string }>(`/items/${id}`, {
      method: "DELETE",
    });
  }

  // Rooms methods
  async getRooms() {
    return this.request<any[]>("/rooms");
  }

  async getRoom(id: number) {
    return this.request<any>(`/rooms/${id}`);
  }

  async createRoom(data: any) {
    return this.request<any>("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createBulkRooms(rooms: any[]) {
    return this.request<any>("/rooms/bulk", {
      method: "POST",
      body: JSON.stringify({ rooms }),
    });
  }

  async updateRoom(id: number, data: any) {
    return this.request<any>(`/rooms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(id: number) {
    return this.request<{ message: string }>(`/rooms/${id}`, {
      method: "DELETE",
    });
  }

  // Places methods
  async getPlaces() {
    return this.request<any[]>("/places");
  }

  async getPlace(id: number) {
    return this.request<any>(`/places/${id}`);
  }

  async createPlace(data: any) {
    return this.request<any>("/places", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createBulkPlaces(places: any[]) {
    return this.request<any>("/places/bulk", {
      method: "POST",
      body: JSON.stringify({ places }),
    });
  }

  async updatePlace(id: number, data: any) {
    return this.request<any>(`/places/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePlace(id: number) {
    return this.request<{ message: string }>(`/places/${id}`, {
      method: "DELETE",
    });
  }

  // Containers methods
  async getContainers() {
    return this.request<any[]>("/containers");
  }

  async getContainer(id: number) {
    return this.request<any>(`/containers/${id}`);
  }

  async createContainer(data: any) {
    return this.request<any>("/containers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createBulkContainers(containers: any[]) {
    return this.request<any>("/containers/bulk", {
      method: "POST",
      body: JSON.stringify({ containers }),
    });
  }

  async updateContainer(id: number, data: any) {
    return this.request<any>(`/containers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteContainer(id: number) {
    return this.request<{ message: string }>(`/containers/${id}`, {
      method: "DELETE",
    });
  }

  // Tags methods
  async getTags() {
    return this.request<any[]>("/tags");
  }

  async createTag(data: any) {
    return this.request<any>("/tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: number, data: any) {
    return this.request<any>(`/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: number) {
    return this.request<{ message: string }>(`/tags/${id}`, {
      method: "DELETE",
    });
  }

  // Favourites methods
  async getFavourites() {
    return this.request<any[]>("/favourites");
  }

  async createFavourite(itemId: number) {
    return this.request<any>("/favourites", {
      method: "POST",
      body: JSON.stringify({ itemId }),
    });
  }

  async deleteFavourite(id: number) {
    return this.request<{ message: string }>(`/favourites/${id}`, {
      method: "DELETE",
    });
  }

  // Consumables methods
  async getConsumables() {
    return this.request<any[]>("/consumables");
  }

  // Alerts methods
  async getAlerts(itemId?: number) {
    const params = itemId ? `?itemId=${itemId}` : "";
    return this.request<any[]>(`/alerts${params}`);
  }

  async createAlert(data: {
    itemId: number;
    threshold: number;
    name?: string;
  }) {
    return this.request<any>("/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAlert(
    id: number,
    data: { isActive?: boolean; threshold?: number; name?: string }
  ) {
    return this.request<any>(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAlert(id: number) {
    return this.request<{ message: string }>(`/alerts/${id}`, {
      method: "DELETE",
    });
  }

  async getAlertsStatistics() {
    return this.request<{
      data: Array<{
        month: string;
        year: number;
        count: number;
      }>;
      total: number;
    }>("/alerts/statistics/monthly");
  }

  async getStatusStatistics() {
    return this.request<{
      data: Array<{
        status: string;
        count: number;
      }>;
      total: number;
    }>("/items/statistics/status");
  }

  // Admin methods
  async getAllUsers() {
    return this.request<any[]>("/admin/users");
  }

  async createUser(data: any) {
    return this.request<any>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any) {
    return this.request<any>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  // Projects methods
  async getProjects() {
    return this.request<any[]>("/projects");
  }

  async getProject(id: number) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(data: {
    name: string;
    description?: string;
    status?: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    startDate?: string;
    endDate?: string;
  }) {
    return this.request<any>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(
    id: number,
    data: {
      name?: string;
      description?: string;
      status?: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      startDate?: string;
      endDate?: string;
    }
  ) {
    return this.request<any>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number) {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Project items methods
  async addItemToProject(projectId: number, itemId: number, quantity: number) {
    return this.request<any>(`/projects/${projectId}/items`, {
      method: "POST",
      body: JSON.stringify({ itemId, quantity }),
    });
  }

  async updateProjectItem(projectId: number, itemId: number, quantity: number) {
    return this.request<any>(`/projects/${projectId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  async removeItemFromProject(projectId: number, itemId: number) {
    return this.request<{ message: string }>(
      `/projects/${projectId}/items/${itemId}`,
      {
        method: "DELETE",
      }
    );
  }

  // Scoring methods
  async getScoringStatistics() {
    return this.request<any>("/projects/scoring/statistics");
  }

  async getTopItems() {
    return this.request<any[]>("/projects/scoring/top-items");
  }

  async getCriticalItems() {
    return this.request<any[]>("/projects/scoring/critical-items");
  }

  async recalculateScores() {
    return this.request<any>("/projects/scoring/recalculate", {
      method: "POST",
    });
  }

  async getProjectStatistics(id: number) {
    return this.request<any>(`/projects/${id}/statistics`);
  }

  async getProjectScoringBreakdown(id: number) {
    return this.request<any>(`/projects/${id}/scoring/breakdown`);
  }

  // Preferences methods
  async getUserPreferences() {
    return this.request<{
      id: number;
      userId: number;
      showWelcomeHeader: boolean;
      showStatsCards: boolean;
      showRecentItems: boolean;
      showRoomDistribution: boolean;
      showAlertsPerMonth: boolean;
      showInventoryValue: boolean;
      showStatusDistribution: boolean;
    }>("/preferences");
  }

  async updateUserPreferences(preferences: {
    showWelcomeHeader?: boolean;
    showStatsCards?: boolean;
    showRecentItems?: boolean;
    showRoomDistribution?: boolean;
    showAlertsPerMonth?: boolean;
    showInventoryValue?: boolean;
    showStatusDistribution?: boolean;
  }) {
    return this.request<{
      id: number;
      userId: number;
      showWelcomeHeader: boolean;
      showStatsCards: boolean;
      showRecentItems: boolean;
      showRoomDistribution: boolean;
      showAlertsPerMonth: boolean;
      showInventoryValue: boolean;
      showStatusDistribution: boolean;
    }>("/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }
}

export const backendApi = new BackendApiService();
export { BackendApiError };
