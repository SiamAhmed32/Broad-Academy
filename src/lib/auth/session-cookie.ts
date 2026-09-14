import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

function requestHost(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host
  );
}

export function sessionCookieSecure(request: NextRequest) {
  const host = requestHost(request);
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return false;
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "");
  return proto === "https";
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  request: NextRequest,
  expiresAt?: Date,
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: sessionCookieSecure(request),
    sameSite: "lax",
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
    priority: "high",
  });
}

export function clearSessionCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: sessionCookieSecure(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
