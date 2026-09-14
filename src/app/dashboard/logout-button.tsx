"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { logoutAndRedirect } from "@/lib/auth/logout-client";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await logoutAndRedirect();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
