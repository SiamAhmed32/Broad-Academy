"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { logoutAndRedirect } from "@/lib/auth/logout-client";
import { cn } from "@/lib/utils";

export default function AdminLogoutButton({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logoutAndRedirect();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60",
        collapsed && "justify-center px-2",
      )}
    >
      <LogOut className="h-4 w-4" />
      {!collapsed ? (loading ? "Signing out..." : "Sign Out") : null}
    </button>
  );
}
