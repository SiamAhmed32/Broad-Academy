import { NextRequest, NextResponse } from "next/server";

import { establishUserSession } from "@/lib/auth/establish-session";
import { applySessionCookie } from "@/lib/auth/session-cookie";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  getGoogleOAuthCredentials,
  googleCallbackUrl,
  readSignedOAuthState,
  requestOrigin,
} from "@/lib/auth/google";
import { safeNextPath } from "@/lib/auth/paths";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function loginError(origin: string, code: string, debug?: string) {
  const url = new URL(`/login?error=${code}`, origin);
  if (debug) url.searchParams.set("debug", debug.slice(0, 240));
  return NextResponse.redirect(url);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const credentials = getGoogleOAuthCredentials();
  if (!credentials) {
    return loginError(origin, "google_failed", "Google keys are missing on the server.");
  }

  if (request.nextUrl.searchParams.get("error")) {
    return loginError(origin, "google_denied");
  }

  const code = request.nextUrl.searchParams.get("code");
  const parsedState = readSignedOAuthState(
    request.nextUrl.searchParams.get("state"),
    credentials.clientSecret,
  );

  if (!code || !parsedState) {
    return loginError(
      origin,
      "google_failed",
      !code ? "Google did not return a login code." : "Login state was invalid. Try again.",
    );
  }

  const next = safeNextPath(parsedState.next);

  try {
    const redirectUri = googleCallbackUrl(origin);
    const accessToken = await exchangeGoogleCode({
      code,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      redirectUri,
    });
    const profile = await fetchGoogleProfile(accessToken);

    if (!profile.emailVerified) {
      return loginError(origin, "google_unverified");
    }

    const existingByGoogle = await db.user.findFirst({
      where: { googleId: profile.googleId },
      select: {
        id: true,
        role: true,
        status: true,
        email: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        googleId: true,
      },
    });

    let user =
      existingByGoogle ??
      (await db.user.findUnique({
        where: { email: profile.email },
        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          googleId: true,
          avatarUrl: true,
          emailVerifiedAt: true,
        },
      }));

    if (user?.status && user.status !== "ACTIVE") {
      return loginError(origin, "account_suspended");
    }

    if (user?.googleId && user.googleId !== profile.googleId) {
      return loginError(origin, "google_failed", "This email is already linked to another Google account.");
    }

    if (!user) {
      user = await db.user.create({
        data: {
          fullName: profile.fullName,
          email: profile.email,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          emailVerifiedAt: new Date(),
          role: "STUDENT",
          adminRole: null,
          permissions: [],
        },
        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          avatarUrl: true,
          emailVerifiedAt: true,
          googleId: true,
        },
      });
    } else if (!existingByGoogle) {
      await db.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          avatarUrl: user.avatarUrl || profile.avatarUrl,
        },
      });
    }

    const { sessionToken, expiresAt } = await establishUserSession({
      userId: user.id,
      role: user.role,
      request,
      rememberMe: true,
    });

    const destination =
      user.role === "ADMIN" && next === "/dashboard" ? "/admin" : next;
    const response = NextResponse.redirect(new URL(destination, origin));
    applySessionCookie(response, sessionToken, request, expiresAt);
    return response;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return loginError(origin, "google_failed", errorMessage(error));
  }
}
