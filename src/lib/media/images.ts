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

export function cloudinaryDisplayImage(value: string, maxWidth = 1400) {
  try {
    const url = new URL(value);
    if (url.hostname !== "res.cloudinary.com") return value;

    const parts = url.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return value;

    const existingTransform = parts[uploadIndex + 1] ?? "";
    if (existingTransform.startsWith("w_") || existingTransform.startsWith("c_")) {
      return value;
    }

    parts.splice(uploadIndex + 1, 0, `w_${maxWidth},c_limit,f_auto,q_auto`);
    url.pathname = `/${parts.join("/")}`;
    return url.toString();
  } catch {
    return value;
  }
}

export function cloudinaryCoverImage(
  value: string,
  width = 960,
  height = 600,
) {
  try {
    const url = new URL(value);
    if (url.hostname !== "res.cloudinary.com") return value;

    const parts = url.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return value;

    const existingTransform = parts[uploadIndex + 1] ?? "";
    if (existingTransform.startsWith("c_")) return value;

    parts.splice(
      uploadIndex + 1,
      0,
      `c_fill,g_auto,w_${width},h_${height},f_auto,q_auto`,
    );
    url.pathname = `/${parts.join("/")}`;
    return url.toString();
  } catch {
    return value;
  }
}
