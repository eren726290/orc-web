import { parseSession } from "../../shared/session/session";
import { object, string } from "../../shared/validation";

export async function request(path: string, input?: unknown): Promise<unknown> {
  const response = await fetch(
    path,
    input === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        },
  );
  const value: unknown = await response.json();
  if (!response.ok) throw new Error(string(object(value).error));
  return value;
}

export async function sessionRequest(path: string, input?: unknown) {
  return parseSession(await request(path, input));
}
