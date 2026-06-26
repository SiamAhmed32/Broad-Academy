
type AdminFetchPayload<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  fields?: Record<string, string[]>;
};

export async function adminFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<{ success: boolean; data?: T; message?: string; fields?: Record<string, string[]> }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      signal: options?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const raw = await response.text().catch(() => "");
    let payload: AdminFetchPayload<T> | null = null;

    if (raw) {
      try {
        payload = JSON.parse(raw) as AdminFetchPayload<T>;
      } catch {
        payload = null;
      }
    }

    if (!payload) {
      const nextDataMessage = raw.match(/"message":"([^"]+)"/)?.[1];
      return {
        success: false,
        message:
          nextDataMessage ??
          (response.ok
            ? "The server returned an invalid response."
            : `Request failed with status ${response.status}.`),
      };
    }

    return {
      success: Boolean(payload.success && response.ok),
      data: payload.data,
      message: payload.message,
      fields: payload.fields,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof DOMException && error.name === "AbortError"
          ? "The request took too long. Please try again."
          : "Could not connect to the server. Please try again.",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function formatAdminDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function slugifyInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
