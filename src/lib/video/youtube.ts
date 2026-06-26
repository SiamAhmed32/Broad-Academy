const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeVideoId(value: string): boolean {
  return YOUTUBE_ID_PATTERN.test(value);
}

export function extractYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (isYouTubeVideoId(input)) return input;

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      candidate =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ??
        null;
    }

    return candidate && isYouTubeVideoId(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
