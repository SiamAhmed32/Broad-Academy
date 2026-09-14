export function safeNextPath(value: string | string[] | null | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path?.startsWith("/") || path.startsWith("//")) return "/dashboard";
  const pathname = path.split("?")[0]?.split("#")[0] || path;
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  ) {
    return "/dashboard";
  }
  return path;
}
