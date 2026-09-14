export async function logoutAndRedirect() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Still leave the page; a leftover cookie will bounce back to the portal.
  }
  window.location.assign("/login");
}
