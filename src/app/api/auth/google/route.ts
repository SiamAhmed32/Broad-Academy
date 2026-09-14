import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  createSignedOAuthState,
  getGoogleOAuthCredentials,
  googleAuthorizationUrl,
  googleCallbackUrl,
  requestOrigin,
} from "@/lib/auth/google";
import { safeNextPath } from "@/lib/auth/paths";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const credentials = getGoogleOAuthCredentials();
  if (!credentials) {
    return errorResponse("Google sign-in is not configured yet.", 503);
  }

  const origin = requestOrigin(request);
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const redirectUri = googleCallbackUrl(origin);
  const authorizeUrl = googleAuthorizationUrl({
    clientId: credentials.clientId,
    redirectUri,
    state: createSignedOAuthState(next, credentials.clientSecret),
  });

  return NextResponse.redirect(authorizeUrl);
}
