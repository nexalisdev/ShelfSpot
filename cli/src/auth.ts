import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

export const BASE_URL = process.env.SHELFSPOT_URL ?? "http://localhost:3001";

const TOKEN_DIR = path.join(os.homedir(), ".shelfspot");
const TOKEN_FILE = path.join(TOKEN_DIR, "session.json");

interface Session {
  token: string;
  email: string;
  expiresAt: number;
}

export function loadSession(): Session | null {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8")) as Session;
    if (Date.now() >= data.expiresAt) {
      fs.unlinkSync(TOKEN_FILE);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveSession(token: string, email: string): void {
  fs.mkdirSync(TOKEN_DIR, { recursive: true });
  const session: Session = { token, email, expiresAt: Date.now() + 55 * 60 * 1000 };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(session), "utf-8");
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
  const cached = loadSession();
  if (cached) return cached.token;

  console.log("No active session. Please log in.");
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

  const data = (await res.json()) as { access_token: string };
  saveSession(data.access_token, email);
  console.log(`Logged in as ${email}\n`);
  return data.access_token;
}
