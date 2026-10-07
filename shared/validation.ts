export function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an object.");
  }
  // SAFETY: the runtime check excludes null, arrays, and primitive values.
  return value as Record<string, unknown>;
}

export function string(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected text.");
  return value;
}

function finite(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Expected a finite number.");
  }
  return value;
}

export function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Expected true or false.");
  return value;
}

export function strings(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Expected a list.");
  return value.map(string);
}

export function stringMap(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(object(value)).map(([key, entry]) => [key, string(entry)]),
  );
}

export function nullableString(value: unknown): string | null {
  return value === null ? null : string(value);
}

export function nonnegativeInteger(value: unknown): number {
  const result = finite(value);
  if (!Number.isInteger(result) || result < 0) throw new Error("Expected a nonnegative integer.");
  return result;
}
