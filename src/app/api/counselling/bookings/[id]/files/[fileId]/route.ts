import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCounsellingFiles } from "@/lib/counselling/file-access";
import { db } from "@/lib/db";
import { signedDownloadUrl, storedAssetFromUrl } from "@/lib/media/signed-download";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; fileId: string }> };

/** Opens (or with ?download=1, downloads) a file shared on a counselling session. */
export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Please sign in again.", 401);

  const { id, fileId } = await context.params;
  const access = await authorizeCounsellingFiles(user, id, "view");
  if (!access.ok) return access.response;

  const file = await db.counsellingFile.findFirst({
    where: { id: fileId, bookingId: id },
    select: { fileUrl: true },
  });
  const asset = file ? storedAssetFromUrl(file.fileUrl) : null;
  if (!asset) return errorResponse("File not found.", 404);

  try {
    const url = signedDownloadUrl(asset, {
      download: request.nextUrl.searchParams.get("download") === "1",
    });
    return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not sign counselling file link:", error);
    return errorResponse("Could not open the file right now.", 503);
  }
}
