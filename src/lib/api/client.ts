export type ApiResponse<T = unknown> = {
  ok: boolean;
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  fields?: Record<string, string[]>;
};

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
};

function buildJsonHeaders(init?: RequestInit): HeadersInit | undefined {
  if (init?.body instanceof FormData) return init.headers;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function parsePayload<T>(
  raw: string,
  response: Response,
): ApiResponse<T> {
  let payload: Record<string, unknown> | null = null;

  if (raw) {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    const nextDataMessage = raw.match(/"message":"([^"]+)"/)?.[1];
    return {
      ok: false,
      success: false,
      status: response.status,
      message:
        nextDataMessage ??
        (response.status === 413
          ? "The file is too large for the server to accept."
          : response.ok
            ? "The server returned an invalid response."
            : `Request failed with status ${response.status}.`),
    };
  }

  const success = Boolean(payload.success && response.ok);
  const extra = Object.fromEntries(
    Object.entries(payload).filter(
      ([key]) => !["success", "data", "message", "fields"].includes(key),
    ),
  ) as Record<string, unknown>;

  return {
    ok: response.ok,
    success,
    status: response.status,
    data: payload.data as T | undefined,
    message: typeof payload.message === "string" ? payload.message : undefined,
    fields: payload.fields as Record<string, string[]> | undefined,
    ...extra,
  };
}

export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const { timeoutMs = 60_000, ...fetchOptions } = options;
  const isFormBody = fetchOptions.body instanceof FormData;
  const controller = new AbortController();
  const timeout =
    typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: fetchOptions.credentials ?? "same-origin",
      cache: fetchOptions.cache ?? "no-store",
      signal: fetchOptions.signal ?? controller.signal,
      headers: isFormBody ? fetchOptions.headers : buildJsonHeaders(fetchOptions),
    });

    const raw = await response.text().catch(() => "");
    return parsePayload<T>(raw, response);
  } catch (error) {
    return {
      ok: false,
      success: false,
      status: 0,
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? "The request took too long. Please try again."
          : "Could not connect to the server. Please try again.",
    };
  } finally {
    if (timeout !== null) window.clearTimeout(timeout);
  }
}
