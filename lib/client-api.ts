export type FieldErrors = Record<string, string>;

export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldErrors = {}
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const hasBody = init.body !== undefined;
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const e = data?.error;
    const fields: FieldErrors = {};
    for (const i of e?.issues ?? []) {
      if (i.path && !fields[i.path]) fields[i.path] = i.message;
    }
    throw new ClientApiError(
      res.status,
      e?.code ?? "UNKNOWN",
      e?.message ?? "Request failed",
      fields
    );
  }
  return data as T;
}

export function errorMessage(e: unknown) {
  return e instanceof ClientApiError ? e.message : "Network error. Please try again.";
}