import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { safeNextPath } from "@/lib/auth/paths";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

type OAuthStatePayload = {
  next: string;
  n: string;
  t: number;
};

export function getGoogleOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleCallbackUrl(origin: string) {
  return `${origin.replace(/\/+$/, "")}/api/auth/google/callback`;
}

export function requestOrigin(request: { nextUrl: URL; headers: Headers; url: string }) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto ||
    request.nextUrl.protocol.replace(":", "") ||
    "http";
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");
  return request.nextUrl.origin.replace(/\/+$/, "");
}

export function createSignedOAuthState(next: string, secret: string) {
  const payload = Buffer.from(
    JSON.stringify({
      next: safeNextPath(next),
      n: randomBytes(16).toString("base64url"),
      t: Date.now(),
    } satisfies OAuthStatePayload),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}~${sig}`;
}

export function readSignedOAuthState(state: string | null, secret: string) {
  if (!state) return null;
  const normalized = decodeURIComponent(state.replace(/ /g, "+"));
  const sep = normalized.includes("~") ? "~" : ".";
  const dot = normalized.lastIndexOf(sep);
  if (dot < 1) return null;
  const payload = normalized.slice(0, dot);
  const sig = normalized.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const actual = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as OAuthStatePayload;
    if (!data?.t || Date.now() - data.t > 10 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export function googleAuthorizationUrl({
  clientId,
  redirectUri,
  state,
}: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeGoogleCode({
  code,
  clientId,
  clientSecret,
  redirectUri,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}): ${raw}`);
  }

  const payload = JSON.parse(raw) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Google token exchange returned no access token.");
  }

  return payload.access_token;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Google userinfo failed (${response.status}): ${raw}`);
  }

  const profile = (await response.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
  };

  const googleId = profile.sub?.trim();
  const email = profile.email?.trim().toLowerCase();
  if (!googleId || !email) {
    throw new Error("Google profile was missing an email.");
  }

  return {
    googleId,
    email,
    emailVerified: profile.email_verified === true || profile.email_verified === "true",
    fullName: profile.name?.trim() || email.split("@")[0] || "Student",
    avatarUrl: profile.picture?.trim() || null,
  };
}
