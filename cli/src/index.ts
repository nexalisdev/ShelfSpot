#!/usr/bin/env node
import { Command } from "commander";
import { requireToken, clearSession, loadSession } from "./auth";
import { api } from "./api";
import { print, ok, fail } from "./print";

const program = new Command();

program
  .name("shelfspot")
  .description("ShelfSpot inventory management CLI")
  .version("1.0.0");

// ─── Auth ─────────────────────────────────────────────────────────────────────

const auth = program.command("auth").description("Authentication");

auth
  .command("login")
  .description("Log in and cache session")
  .action(async () => {
    try {
      await requireToken();
    } catch (e) { fail(e); }
  });

auth
  .command("logout")
  .description("Clear cached session")
  .action(() => clearSession());

auth
  .command("profile")
  .description("Show current user profile")
  .action(async () => {
    try {
      const token = await requireToken();
      print(await api(token, "GET", "/auth/profile"));
    } catch (e) { fail(e); }
  });

auth
  .command("whoami")
  .description("Show logged-in email")
  .action(() => {
    const session = loadSession();
    if (session) console.log(session.email);
    else console.log("Not logged in.");
  });

// ─── Items ────────────────────────────────────────────────────────────────────

const items = program.command("items").description("Inventory items");

items
  .command("list")
  .description("List all items")
  .action(async () => {
    try {
      const token = await requireToken();
      print(await api(token, "GET", "/items"));
    } catch (e) { fail(e); }
  });

items
  .command("search <query>")
  .description("Search items by name")
  .action(async (query: string) => {
    try {
      const token = await requireToken();
      print(await api(token, "GET", `/items/search?q=${encodeURIComponent(query)}`));
    } catch (e) { fail(e); }
  });

items
  .command("get <id>")
  .description("Get item by ID")
  .action(async (id: string) => {
    try {
      const token = await requireToken();
      print(await api(token, "GET", `/items/${id}`));
    } catch (e) { fail(e); }
  });

items
  .command("create")
  .description("Create a new item")
  .requiredOption("--name <name>", "Item name")
  .requiredOption("--quantity <n>", "Quantity", parseInt)
  .requiredOption("--room-id <id>", "Room ID", parseInt)
  .option("--place-id <id>", "Place ID", parseInt)
  .option("--container-id <id>", "Container ID", parseInt)
  .option("--status <status>", "Status (e.g. Available, In use, Broken)")
  .option("--price <n>", "Purchase price", parseFloat)
  .option("--sellprice <n>", "Selling price", parseFloat)
  .option("--consumable <bool>", "Mark as consumable: true or false (default: false)")
  .option("--item-link <url>", "URL link to item")
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = {
        name: opts.name,
        quantity: opts.quantity,
        roomId: opts.roomId,
        consumable: opts.consumable === "true",
      };
      if (opts.placeId !== undefined) body.placeId = opts.placeId;
      if (opts.containerId !== undefined) body.containerId = opts.containerId;
      if (opts.status) body.status = opts.status;
      if (opts.price !== undefined) body.price = opts.price;
      if (opts.sellprice !== undefined) body.sellprice = opts.sellprice;
      if (opts.itemLink) body.itemLink = opts.itemLink;
      const result = await api(token, "POST", "/items", body);
      ok("Item created");
      print(result);
    } catch (e) { fail(e); }
  });

items
  .command("update <id>")
  .description("Update an item")
  .option("--name <name>")
  .option("--quantity <n>", "Quantity", parseInt)
  .option("--room-id <id>", "Room ID", parseInt)
  .option("--place-id <id>", "Place ID", parseInt)
  .option("--container-id <id>", "Container ID", parseInt)
  .option("--status <status>")
  .option("--price <n>", "Purchase price", parseFloat)
  .option("--sellprice <n>", "Selling price", parseFloat)
  .option("--item-link <url>")
  .option("--tags <tags>", "Comma-separated tag names")
  .action(async (id: string, opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.quantity !== undefined) body.quantity = opts.quantity;
      if (opts.roomId !== undefined) body.roomId = opts.roomId;
      if (opts.placeId !== undefined) body.placeId = opts.placeId;
      if (opts.containerId !== undefined) body.containerId = opts.containerId;
      if (opts.status) body.status = opts.status;
      if (opts.price !== undefined) body.price = opts.price;
      if (opts.sellprice !== undefined) body.sellprice = opts.sellprice;
      if (opts.itemLink) body.itemLink = opts.itemLink;
      if (opts.tags) body.tags = (opts.tags as string).split(",").map((t: string) => t.trim());
      const result = await api(token, "PATCH", `/items/${id}`, body);
      ok(`Item ${id} updated`);
      print(result);
    } catch (e) { fail(e); }
  });

items
  .command("delete <id>")
  .description("Delete an item")
  .action(async (id: string) => {
    try {
      const token = await requireToken();
      await api(token, "DELETE", `/items/${id}`);
      ok(`Item ${id} deleted`);
    } catch (e) { fail(e); }
  });

items
  .command("stats")
  .description("Show status distribution statistics")
  .action(async () => {
    try {
      const token = await requireToken();
      print(await api(token, "GET", "/items/statistics/status"));
    } catch (e) { fail(e); }
  });

items
  .command("value")
  .description("Show total inventory value")
  .action(async () => {
    try {
      const token = await requireToken();
      print(await api(token, "GET", "/items/inventory-value"));
    } catch (e) { fail(e); }
  });

// ─── Rooms ────────────────────────────────────────────────────────────────────

const rooms = program.command("rooms").description("Rooms");

rooms
  .command("list")
  .action(async () => {
    try { print(await api(await requireToken(), "GET", "/rooms")); }
    catch (e) { fail(e); }
  });

rooms
  .command("get <id>")
  .action(async (id: string) => {
    try { print(await api(await requireToken(), "GET", `/rooms/${id}`)); }
    catch (e) { fail(e); }
  });

rooms
  .command("create")
  .requiredOption("--name <name>")
  .option("--description <desc>")
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.description) body.description = opts.description;
      const result = await api(token, "POST", "/rooms", body);
      ok("Room created"); print(result);
    } catch (e) { fail(e); }
  });

rooms
  .command("bulk-create")
  .description("Create multiple rooms (comma-separated names)")
  .requiredOption("--names <names>", "Comma-separated room names")
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const roomsList = (opts.names as string).split(",").map((n: string) => ({ name: n.trim() }));
      const result = await api(token, "POST", "/rooms/bulk", { rooms: roomsList });
      ok(`${roomsList.length} rooms created`); print(result);
    } catch (e) { fail(e); }
  });

rooms
  .command("update <id>")
  .option("--name <name>")
  .option("--description <desc>")
  .action(async (id: string, opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.description) body.description = opts.description;
      const result = await api(token, "PATCH", `/rooms/${id}`, body);
      ok(`Room ${id} updated`); print(result);
    } catch (e) { fail(e); }
  });

rooms
  .command("delete <id>")
  .action(async (id: string) => {
    try {
      await api(await requireToken(), "DELETE", `/rooms/${id}`);
      ok(`Room ${id} deleted`);
    } catch (e) { fail(e); }
  });

// ─── Places ───────────────────────────────────────────────────────────────────

const places = program.command("places").description("Places within rooms");

places
  .command("list")
  .action(async () => {
    try { print(await api(await requireToken(), "GET", "/places")); }
    catch (e) { fail(e); }
  });

places
  .command("get <id>")
  .action(async (id: string) => {
    try { print(await api(await requireToken(), "GET", `/places/${id}`)); }
    catch (e) { fail(e); }
  });

places
  .command("create")
  .requiredOption("--name <name>")
  .requiredOption("--room-id <id>", "Room ID", parseInt)
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const result = await api(token, "POST", "/places", { name: opts.name, roomId: opts.roomId });
      ok("Place created"); print(result);
    } catch (e) { fail(e); }
  });

places
  .command("update <id>")
  .requiredOption("--name <name>")
  .action(async (id: string, opts) => {
    try {
      const token = await requireToken();
      const result = await api(token, "PATCH", `/places/${id}`, { name: opts.name });
      ok(`Place ${id} updated`); print(result);
    } catch (e) { fail(e); }
  });

places
  .command("delete <id>")
  .action(async (id: string) => {
    try {
      await api(await requireToken(), "DELETE", `/places/${id}`);
      ok(`Place ${id} deleted`);
    } catch (e) { fail(e); }
  });

// ─── Containers ───────────────────────────────────────────────────────────────

const containers = program.command("containers").description("Containers (boxes, shelves…)");

containers
  .command("list")
  .action(async () => {
    try { print(await api(await requireToken(), "GET", "/containers")); }
    catch (e) { fail(e); }
  });

containers
  .command("get <id>")
  .action(async (id: string) => {
    try { print(await api(await requireToken(), "GET", `/containers/${id}`)); }
    catch (e) { fail(e); }
  });

containers
  .command("create")
  .requiredOption("--name <name>")
  .option("--icon <icon>")
  .option("--room-id <id>", "Room ID", parseInt)
  .option("--place-id <id>", "Place ID", parseInt)
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.icon) body.icon = opts.icon;
      if (opts.roomId !== undefined) body.roomId = opts.roomId;
      if (opts.placeId !== undefined) body.placeId = opts.placeId;
      const result = await api(token, "POST", "/containers", body);
      ok("Container created"); print(result);
    } catch (e) { fail(e); }
  });

containers
  .command("update <id>")
  .option("--name <name>")
  .option("--icon <icon>")
  .option("--room-id <id>", "Room ID", parseInt)
  .option("--place-id <id>", "Place ID", parseInt)
  .action(async (id: string, opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.icon) body.icon = opts.icon;
      if (opts.roomId !== undefined) body.roomId = opts.roomId;
      if (opts.placeId !== undefined) body.placeId = opts.placeId;
      const result = await api(token, "PATCH", `/containers/${id}`, body);
      ok(`Container ${id} updated`); print(result);
    } catch (e) { fail(e); }
  });

containers
  .command("delete <id>")
  .action(async (id: string) => {
    try {
      await api(await requireToken(), "DELETE", `/containers/${id}`);
      ok(`Container ${id} deleted`);
    } catch (e) { fail(e); }
  });

// ─── Tags ─────────────────────────────────────────────────────────────────────

const tags = program.command("tags").description("Tags");

tags
  .command("list")
  .action(async () => {
    try { print(await api(await requireToken(), "GET", "/tags")); }
    catch (e) { fail(e); }
  });

tags
  .command("create")
  .requiredOption("--name <name>")
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const result = await api(token, "POST", "/tags", { name: opts.name });
      ok("Tag created"); print(result);
    } catch (e) { fail(e); }
  });

tags
  .command("update <id>")
  .requiredOption("--name <name>")
  .action(async (id: string, opts) => {
    try {
      const token = await requireToken();
      const result = await api(token, "PATCH", `/tags/${id}`, { name: opts.name });
      ok(`Tag ${id} updated`); print(result);
    } catch (e) { fail(e); }
  });

tags
  .command("delete <id>")
  .action(async (id: string) => {
    try {
      await api(await requireToken(), "DELETE", `/tags/${id}`);
      ok(`Tag ${id} deleted`);
    } catch (e) { fail(e); }
  });

// ─── Alerts ───────────────────────────────────────────────────────────────────

const alerts = program.command("alerts").description("Stock alerts");

alerts
  .command("list")
  .option("--item-id <id>", "Filter by item ID", parseInt)
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const qs = opts.itemId !== undefined ? `?itemId=${opts.itemId}` : "";
      print(await api(token, "GET", `/alerts${qs}`));
    } catch (e) { fail(e); }
  });

alerts
  .command("create")
  .requiredOption("--item-id <id>", "Item ID", parseInt)
  .requiredOption("--threshold <n>", "Quantity threshold", parseInt)
  .option("--name <name>", "Alert name")
  .action(async (opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = { itemId: opts.itemId, threshold: opts.threshold };
      if (opts.name) body.name = opts.name;
      const result = await api(token, "POST", "/alerts", body);
      ok("Alert created"); print(result);
    } catch (e) { fail(e); }
  });

alerts
  .command("update <id>")
  .option("--threshold <n>", "Quantity threshold", parseInt)
  .option("--name <name>")
  .option("--active <bool>", "true or false")
  .action(async (id: string, opts) => {
    try {
      const token = await requireToken();
      const body: Record<string, unknown> = {};
      if (opts.threshold !== undefined) body.threshold = opts.threshold;
      if (opts.name) body.name = opts.name;
      if (opts.active !== undefined) body.isActive = opts.active === "true";
      const result = await api(token, "PATCH", `/alerts/${id}`, body);
      ok(`Alert ${id} updated`); print(result);
    } catch (e) { fail(e); }
  });

alerts
  .command("delete <id>")
  .action(async (id: string) => {
    try {
      await api(await requireToken(), "DELETE", `/alerts/${id}`);
      ok(`Alert ${id} deleted`);
    } catch (e) { fail(e); }
  });

alerts
  .command("check")
  .description("Trigger alert check and send notifications")
  .action(async () => {
    try {
      const result = await api(await requireToken(), "POST", "/alerts/check");
      ok("Alerts checked"); print(result);
    } catch (e) { fail(e); }
  });

alerts
  .command("stats")
  .description("Monthly alerts statistics")
  .action(async () => {
    try { print(await api(await requireToken(), "GET", "/alerts/statistics/monthly")); }
    catch (e) { fail(e); }
  });

// ─── Favourites ───────────────────────────────────────────────────────────────

const favs = program.command("favourites").description("Favourite items").alias("favs");

favs
  .command("list")
  .action(async () => {
    try { print(await api(await requireToken(), "GET", "/favourites")); }
    catch (e) { fail(e); }
  });

favs
  .command("add <item-id>")
  .action(async (itemId: string) => {
    try {
      await api(await requireToken(), "POST", `/favourites/item/${itemId}`);
      ok(`Item ${itemId} added to favourites`);
    } catch (e) { fail(e); }
  });

favs
  .command("remove <item-id>")
  .action(async (itemId: string) => {
    try {
      await api(await requireToken(), "DELETE", `/favourites/item/${itemId}`);
      ok(`Item ${itemId} removed from favourites`);
    } catch (e) { fail(e); }
  });

program.parse();
