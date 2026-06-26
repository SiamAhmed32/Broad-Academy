import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import { resolveDocumentAccess } from "@/lib/documents/cloudinary";

export const runtime = "nodejs";

const PREVIEW_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

function getFileExtension(fileName?: string | null) {
  const match = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? null;
}

function resolveContentType(
  upstreamContentType: string | null,
  fileFormat?: string | null,
  fileName?: string | null,
) {
  const normalizedFormat =
    fileFormat?.toLowerCase() || getFileExtension(fileName) || "";

  if (normalizedFormat && PREVIEW_CONTENT_TYPES[normalizedFormat]) {
    return PREVIEW_CONTENT_TYPES[normalizedFormat];
  }

  if (
    upstreamContentType &&
    !["application/octet-stream", "binary/octet-stream"].includes(
      upstreamContentType.toLowerCase(),
    )
  ) {
    return upstreamContentType;
  }

  return "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.DOCUMENTS);
  if (error) return error;

  const { id } = await context.params;
  const download = request.nextUrl.searchParams.get("download") === "1";

  const document = await db.documentSubmission.findUnique({
    where: { id },
    select: {
      fileUrl: true,
      filePublicId: true,
      fileFormat: true,
      fileName: true,
      fileResourceType: true,
      documentType: true,
    },
  });

  if (!document?.fileUrl) {
    return errorResponse("Document file not found.", 404);
  }
  let url: string;
  try {
    url = resolveDocumentAccess(
      {
        ...document,
        fileName:
          document.fileName ||
          `${document.documentType.replace(/[^\w.\-() ]+/g, "_")}.${document.fileFormat || "pdf"}`,
      },
      { download },
    );
  } catch {
    return errorResponse("Could not prepare the document link.", 502);
  }

  try {
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      return errorResponse("Could not retrieve file from storage.", 502);
    }

    const contentType = resolveContentType(
      fileResponse.headers.get("content-type"),
      document.fileFormat,
      document.fileName,
    );

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("X-Content-Type-Options", "nosniff");

    if (download) {
      const filename =
        document.fileName ||
        `${document.documentType}.${document.fileFormat || "pdf"}`;
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      headers.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
    } else {
      const filename =
        document.fileName ||
        `${document.documentType}.${document.fileFormat || "pdf"}`;
      const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      headers.set("Content-Disposition", `inline; filename="${safeFilename}"`);
    }

    return new NextResponse(fileResponse.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Failed to stream document file:", err);
    return errorResponse("Failed to stream the document file.", 502);
  }
}
