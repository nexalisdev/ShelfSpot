import { BASE_URL } from "./auth";

export async function api<T = unknown>(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  if (!res.ok) {
    let msg: string;
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      msg = Array.isArray(parsed.message)
        ? parsed.message.join(", ")
        : (parsed.message ?? text);
    } catch {
      msg = text;
    }
    throw new Error(`${res.status} ${msg}`);
  }

  return (text ? JSON.parse(text) : {}) as T;
}
