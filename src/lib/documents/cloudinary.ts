import { deleteStoredAsset, storedAssetFromUrl, type StoredAsset } from "@/lib/media/signed-download";

/** A stored document file: the student's upload or the admin's reply attachment. */
export type DocumentFileRecord = {
  fileUrl: string;
  filePublicId?: string | null;
  fileFormat?: string | null;
  fileName?: string | null;
  fileResourceType?: string | null;
  documentType?: string;
};

/** Where a document file lives on Cloudinary (older rows only stored the URL). */
export function documentAsset(file: DocumentFileRecord): StoredAsset | null {
  if (file.filePublicId) {
    const resourceType = file.fileResourceType === "raw" ? "raw" : "image";
    return {
      publicId: file.filePublicId,
      resourceType,
      format: resourceType === "raw" ? "" : (file.fileFormat ?? "jpg"),
    };
  }
  return storedAssetFromUrl(file.fileUrl);
}

/** Deletes a document file that nothing points to any more. */
export async function deleteDocumentFile(file: DocumentFileRecord) {
  const asset = documentAsset(file);
  if (asset) await deleteStoredAsset(asset);
}
