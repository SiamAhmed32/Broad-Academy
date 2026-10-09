import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { documentAsset, type DocumentFileRecord } from "@/lib/documents/cloudinary";
import { signedDownloadUrl } from "@/lib/media/signed-download";

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

/**
 * Sends the browser to a short-lived signed link for the file. Cloudinary
 * blocks public PDF delivery on this account and Vercel limits function
 * responses, so we redirect instead of proxying the bytes.
 */
export function documentFileResponse(file: DocumentFileRecord, download: boolean) {
  const asset = documentAsset(file);
  if (!asset) return errorResponse("Document file not found.", 404);
  try {
    return NextResponse.redirect(signedDownloadUrl(asset, { download }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Could not sign document link:", error);
    return errorResponse("Could not prepare the document link.", 502);
  }
}
