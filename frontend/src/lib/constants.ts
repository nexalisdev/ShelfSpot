// Common constants used across the application

// Backend API endpoints (NestJS)
export const API_ENDPOINTS = {
  ROOMS: "/rooms",
  PLACES: "/places",
  CONTAINERS: "/containers",
  ITEMS: "/items",
  TAGS: "/tags",
  FAVOURITES: "/favourites",
  CONSUMABLES: "/consumables",
  USER: "/auth/profile",
} as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export const COMMON_INPUT_CLASSES =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" as const;

export const OBJECT_TYPES = [
  { key: "room", label: "Room" },
  { key: "place", label: "Place" },
  { key: "container", label: "Container" },
  { key: "item", label: "Item" },
] as const;

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/consumables", label: "Consumables" },
  { href: "/favourites", label: "Favorites" },
] as const;
