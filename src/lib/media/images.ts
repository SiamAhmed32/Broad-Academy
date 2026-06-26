export function isSafeStoredImageReference(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !value.includes("\\") && !value.includes("..");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isManagedCloudinaryImage(value: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;

  try {
    const url = new URL(value);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      pathParts[0] === cloudName &&
      pathParts[1] === "image" &&
      pathParts[2] === "upload"
    );
  } catch {
    return false;
  }
}
