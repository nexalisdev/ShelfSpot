import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

export const BASE_URL = process.env.SHELFSPOT_URL ?? "http://localhost:3001";

const TOKEN_DIR = path.join(os.homedir(), ".shelfspot");
const TOKEN_FILE = path.join(TOKEN_DIR, "session.json");

interface Session {
  token: string;
  refreshToken: string;
  email: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export function loadSession(): Session | null {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8")) as Session;
  } catch {
    return null;
  }
}

function saveSession(
  token: string,
  refreshToken: string,
  email: string,
  refreshExpiresAt: number
): void {
  fs.mkdirSync(TOKEN_DIR, { recursive: true });
  const session: Session = {
    token,
    refreshToken,
    email,
    expiresAt: Date.now() + 55 * 60 * 1000,
    refreshExpiresAt,
  };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(session), "utf-8");
}

async function silentRefresh(session: Session): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    saveSession(data.access_token, data.refresh_token, session.email, session.refreshExpiresAt);
    return data.access_token;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
  console.log("Session cleared.");
}

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let value = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      const onData = (ch: string) => {
        if (ch === "\n" || ch === "\r" || ch === "") {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener("data", onData);
          rl.close();
          process.stdout.write("\n");
          if (ch === "") process.exit(0);
          resolve(value);
        } else if (ch === "") {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      };
      process.stdin.on("data", onData);
    } else {
      rl.question(question, (ans) => { rl.close(); resolve(ans); });
    }
  });
}

export async function requireToken(): Promise<string> {
  const session = loadSession();

  if (session) {
    // Access token still valid
    if (Date.now() < session.expiresAt) return session.token;

    // Access token expired — try silent refresh if refresh token is still valid
    if (Date.now() < session.refreshExpiresAt) {
      const newToken = await silentRefresh(session);
      if (newToken) return newToken;
    }
  }

  // No session or both tokens expired — prompt for credentials
  console.log("Please log in to ShelfSpot.");
  const email = await ask("Email: ");
  const password = await ask("Password: ", true);

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Login failed (${res.status}): ${body}`);
    process.exit(1);
  }

  const data = (await res.json()) as { access_token: string; refresh_token: string };
  const refreshExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  saveSession(data.access_token, data.refresh_token, email, refreshExpiresAt);
  console.log(`Logged in as ${email}\n`);
  return data.access_token;
}
