export function print(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function ok(msg: string): void {
  console.log(`✓ ${msg}`);
}

export function fail(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`✗ ${msg}`);
  process.exit(1);
}
