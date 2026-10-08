"use client";

import { createContext, useContext } from "react";

import type { AdminPermission } from "@/lib/admin/permissions";

const AdminPermissionsContext = createContext<AdminPermission[]>([]);

export const AdminPermissionsProvider = AdminPermissionsContext.Provider;

/**
 * True when the signed-in staff member holds the permission. Used to hide
 * controls a view-only role (e.g. Manager) cannot use; the API still enforces it.
 */
export function useAdminCan(permission: AdminPermission) {
  return useContext(AdminPermissionsContext).includes(permission);
}
