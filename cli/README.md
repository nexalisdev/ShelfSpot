# ShelfSpot CLI

Command-line interface for ShelfSpot — manage your inventory without opening a browser.

## Installation

### From the setup wizard (recommended)

Run `setup.ps1` (Windows) or `setup.sh` (Linux/macOS) at the root of the repository and choose
**CLI only** or include it as part of a full installation.

### Manual

```bash
cd cli
npm install
npm run build
npm link
```

Set the URL of your ShelfSpot instance once:

```bash
# Linux / macOS
export SHELFSPOT_URL=http://192.168.1.10:8082

# Windows (PowerShell) — persists across sessions
[System.Environment]::SetEnvironmentVariable("SHELFSPOT_URL","http://192.168.1.10:8082","User")
```

The default when the variable is absent is `http://localhost:3001`.

---

## Authentication

Sessions are cached in `~/.shelfspot/session.json` and last up to **30 days** via automatic token
refresh. You only need to log in once per month.

```bash
shelfspot auth login          # prompt for email + password, cache session
shelfspot auth logout         # delete cached session
shelfspot auth whoami         # print the email of the logged-in user
shelfspot auth profile        # show full profile (name, email, id…)
```

If your access token expires mid-session, the CLI refreshes it silently without prompting you again.

---

## Quick start

```bash
# 1. Log in
shelfspot auth login

# 2. Create your first room
shelfspot rooms create --name "Living room"

# 3. Add a place inside that room (use the id returned above)
shelfspot places create --name "TV shelf" --room-id 1

# 4. Add an item
shelfspot items create --name "HDMI cable" --quantity 3 --room-id 1 --place-id 1

# 5. Search for it later
shelfspot items search "hdmi"

# 6. Update its quantity
shelfspot items update 1 --quantity 2
```

---

## Commands reference

### `auth`

| Command | Description |
|---|---|
| `auth login` | Log in and cache session |
| `auth logout` | Clear cached session |
| `auth whoami` | Show logged-in email |
| `auth profile` | Show full user profile |

---

### `items`

| Command | Description |
|---|---|
| `items list` | List all items |
| `items search <query>` | Full-text search (case-insensitive) |
| `items get <id>` | Get one item by ID |
| `items create [options]` | Create an item |
| `items update <id> [options]` | Update an item |
| `items delete <id>` | Delete an item |
| `items stats` | Status distribution across all items |
| `items value` | Total purchase and sell value of inventory |

**`items create` options**

| Flag | Required | Description |
|---|---|---|
| `--name <name>` | yes | Item name |
| `--quantity <n>` | yes | Quantity (integer) |
| `--room-id <id>` | yes | Room the item lives in |
| `--place-id <id>` | | Specific place within the room |
| `--container-id <id>` | | Container (box, shelf…) |
| `--status <status>` | | e.g. `Available`, `In use`, `Broken` |
| `--price <n>` | | Purchase price |
| `--sellprice <n>` | | Selling / estimated price |
| `--consumable <bool>` | | `true` or `false` (default: false) |
| `--item-link <url>` | | Link to product page |

**`items update` options** — same flags as create, all optional. Additionally:

| Flag | Description |
|---|---|
| `--tags <names>` | Comma-separated tag names to assign |

Examples:

```bash
shelfspot items create --name "Coffee beans" --quantity 5 --room-id 2 --consumable true
shelfspot items update 7 --quantity 3 --status "Running low"
shelfspot items update 7 --tags "food,pantry"
shelfspot items search "cable"
shelfspot items stats
shelfspot items value
```

---

### `rooms`

| Command | Description |
|---|---|
| `rooms list` | List all rooms |
| `rooms get <id>` | Get one room |
| `rooms create --name <name> [--description <desc>]` | Create a room |
| `rooms bulk-create --names <names>` | Create several rooms at once |
| `rooms update <id> [--name] [--description]` | Rename / redescribe a room |
| `rooms delete <id>` | Delete a room |

```bash
shelfspot rooms create --name "Kitchen" --description "Main kitchen"
shelfspot rooms bulk-create --names "Garage,Attic,Basement"
shelfspot rooms update 3 --name "Garage (main)"
```

---

### `places`

A place is a named spot within a room (e.g. "top shelf", "drawer 2").

| Command | Description |
|---|---|
| `places list` | List all places |
| `places get <id>` | Get one place |
| `places create --name <name> --room-id <id>` | Create a place |
| `places update <id> --name <name>` | Rename a place |
| `places delete <id>` | Delete a place |

```bash
shelfspot places create --name "Top shelf" --room-id 1
shelfspot places update 2 --name "Middle shelf"
```

---

### `containers`

A container is a box, bin, or shelf unit that can hold items.

| Command | Description |
|---|---|
| `containers list` | List all containers |
| `containers get <id>` | Get one container |
| `containers create --name <name> [options]` | Create a container |
| `containers update <id> [options]` | Update a container |
| `containers delete <id>` | Delete a container |

**Options for `create` and `update`**

| Flag | Description |
|---|---|
| `--name <name>` | Container name |
| `--icon <icon>` | Icon name (e.g. `box`, `archive`) |
| `--room-id <id>` | Room this container belongs to |
| `--place-id <id>` | Place within the room |

```bash
shelfspot containers create --name "Tool box" --icon "box" --room-id 3
shelfspot containers update 1 --place-id 2
```

---

### `tags`

| Command | Description |
|---|---|
| `tags list` | List all tags |
| `tags create --name <name>` | Create a tag |
| `tags update <id> --name <name>` | Rename a tag |
| `tags delete <id>` | Delete a tag |

Tags are assigned to items via `items update --tags`.

```bash
shelfspot tags create --name "electronics"
shelfspot tags list
shelfspot items update 5 --tags "electronics,fragile"
```

---

### `alerts`

Alerts trigger when an item's quantity falls below a threshold.

| Command | Description |
|---|---|
| `alerts list [--item-id <id>]` | List alerts (optionally filtered by item) |
| `alerts create --item-id <id> --threshold <n> [--name]` | Create an alert |
| `alerts update <id> [options]` | Update an alert |
| `alerts delete <id>` | Delete an alert |
| `alerts check` | Manually trigger alert check and send notifications |
| `alerts stats` | Monthly alert statistics |

**`alerts update` options**

| Flag | Description |
|---|---|
| `--threshold <n>` | New quantity threshold |
| `--name <name>` | Rename the alert |
| `--active <bool>` | `true` to enable, `false` to disable |

```bash
shelfspot alerts create --item-id 3 --threshold 2 --name "Low coffee"
shelfspot alerts update 1 --threshold 5 --active true
shelfspot alerts list --item-id 3
shelfspot alerts check
```

---

### `favourites` (alias: `favs`)

| Command | Description |
|---|---|
| `favs list` | List favourite items |
| `favs add <item-id>` | Add an item to favourites |
| `favs remove <item-id>` | Remove an item from favourites |

```bash
shelfspot favs add 7
shelfspot favs list
shelfspot favs remove 7
```

---

## Typical workflows

### Initial setup of a room

```bash
shelfspot rooms create --name "Workshop"
# -> { "id": 4, "name": "Workshop" }

shelfspot places create --name "Pegboard" --room-id 4
shelfspot places create --name "Workbench drawer" --room-id 4

shelfspot containers create --name "Small parts bin" --room-id 4 --place-id 5

shelfspot items create --name "M3 screws" --quantity 200 \
  --room-id 4 --place-id 5 --container-id 1 --consumable true
```

### Inventory audit

```bash
shelfspot items list          # full list
shelfspot items stats         # breakdown by status
shelfspot items value         # total value
```

### Setting up low-stock alerts

```bash
# Alert when M3 screws (id 12) drop below 50
shelfspot alerts create --item-id 12 --threshold 50 --name "Reorder M3 screws"

# Run a manual check (normally triggered automatically)
shelfspot alerts check
```

### Moving an item to a different room

```bash
shelfspot items update 12 --room-id 2 --place-id 8
```

---

## Output

All commands print pretty-printed JSON. Pipe through `jq` for filtering:

```bash
shelfspot items list | jq '.[] | {id, name, quantity}'
shelfspot items search "cable" | jq '.[0].id'
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SHELFSPOT_URL` | `http://localhost:3001` | Base URL of your ShelfSpot backend |

---

## Session storage

The session file is stored at `~/.shelfspot/session.json`. It contains your access token (valid
55 minutes) and a refresh token (valid 30 days). The CLI rotates the refresh token automatically
on each use, so an active session stays alive indefinitely without re-prompting.

To fully log out and remove all stored credentials:

```bash
shelfspot auth logout
```
