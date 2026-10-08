"use client";

import { useCallback } from "react";

import { notify } from "@/lib/toast";

/**
 * Admin pages call showToast(message, error?) to report the outcome of an
 * action. It goes through the site-wide toaster (see src/lib/toast.ts), so
 * there is nothing to render on the page.
 */
export function useAdminToast() {
  const showToast = useCallback((message: string, error = false) => {
    if (error) notify.error(message);
    else notify.success(message);
  }, []);

  return { showToast };
}
