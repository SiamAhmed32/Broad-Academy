import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import {
  resolveDocumentAccess,
  type DocumentFileRecord,
} from "@/lib/documents/cloudinary";

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

type DocumentRow = {
  documentType: string;
  fileUrl: string;
  filePublicId: string | null;
  fileFormat: string | null;
  fileName: string | null;
  fileResourceType: string | null;
  replyFileUrl: string | null;
  replyFilePublicId: string | null;
  replyFileFormat: string | null;
  replyFileName: string | null;
  replyFileResourceType: string | null;
};

export const documentFileSelect = {
  documentType: true,
  fileUrl: true,
  filePublicId: true,
  fileFormat: true,
  fileName: true,
  fileResourceType: true,
  replyFileUrl: true,
  replyFilePublicId: true,
  replyFileFormat: true,
  replyFileName: true,
  replyFileResourceType: true,
} as const;

/** Picks the student's original upload or the admin's reply attachment. */
export function pickDocumentFile(
  document: DocumentRow,
  which: "original" | "reply",
): DocumentFileRecord | null {
  if (which === "reply") {
    if (!document.replyFileUrl) return null;
    return {
      fileUrl: document.replyFileUrl,
      filePublicId: document.replyFilePublicId,
      fileFormat: document.replyFileFormat,
      fileName: document.replyFileName,
      fileResourceType: document.replyFileResourceType,
      documentType: `${document.documentType} reply`,
    };
  }
  if (!document.fileUrl) return null;
  return {
    fileUrl: document.fileUrl,
    filePublicId: document.filePublicId,
    fileFormat: document.fileFormat,
    fileName: document.fileName,
    fileResourceType: document.fileResourceType,
    documentType: document.documentType,
  };
}

export async function streamDocumentFile(
  file: DocumentFileRecord,
  download: boolean,
) {
  const documentType = file.documentType ?? "document";
  const fileName =
    file.fileName ||
    `${documentType.replace(/[^\w.\-() ]+/g, "_")}.${file.fileFormat || "pdf"}`;

  let url: string;
  try {
    url = resolveDocumentAccess({ ...file, fileName }, { download });
  } catch {
    return errorResponse("Could not prepare the document link.", 502);
  }

  try {
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      return errorResponse("Could not retrieve file from storage.", 502);
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      resolveContentType(
        fileResponse.headers.get("content-type"),
        file.fileFormat,
        file.fileName,
      ),
    );
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("X-Content-Type-Options", "nosniff");
    const safeFilename = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${safeFilename}"`,
    );

    return new NextResponse(fileResponse.body, { status: 200, headers });
  } catch (err) {
    console.error("Failed to stream document file:", err);
    return errorResponse("Failed to stream the document file.", 502);
  }
}
