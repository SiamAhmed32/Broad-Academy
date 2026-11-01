"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CounsellingBookingSummary } from "@/lib/student/types";

type Result = {
  bookings: CounsellingBookingSummary[];
  counts: Record<"PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED", number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  paymentConfig: { bkashNumber: string | null; paymentConfigured: boolean };
};

export function useCounsellingSessions({
  search,
  status,
  page,
  month,
}: {
  search: string;
  status: string;
  page: number;
  month?: string;
}) {
  const [data, setData] = useState<Result | null>(null);
  const [dataQuery, setDataQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const request = useRef<{ key: string; controller: AbortController } | null>(
    null,
  );
  const queryParams = new URLSearchParams({
    page: String(month ? 1 : page),
    limit: month ? "20" : "8",
  });
  if (debouncedSearch.trim()) queryParams.set("search", debouncedSearch.trim());
  if (status) queryParams.set("status", status);
  if (month) queryParams.set("month", month);
  const queryKey = queryParams.toString();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const refresh = useCallback(
    async (force = false) => {
      const params = new URLSearchParams(queryKey);
      const key = queryKey;
      if (!force && request.current?.key === key) return;
      request.current?.controller.abort();
      const controller = new AbortController();
      request.current = { key, controller };
      setLoading(true);
      setError(null);
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const fetchPage = async (): Promise<Result> => {
          const response = await fetch(`/api/counselling/bookings?${params}`, {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          });
          const payload = await response.json();
          if (!response.ok || !payload.success)
            throw new Error(payload.message || "Could not load your sessions.");
          return payload.data;
        };
        const result = await fetchPage();
        // Calendar views need every event in the month, not just the first list page.
        if (month) {
          for (let next = 2; next <= result.pagination.totalPages; next++) {
            params.set("page", String(next));
            const more = await fetchPage();
            result.bookings.push(...more.bookings);
          }
        }
        if (request.current?.controller !== controller) return;
        setData(result);
        setDataQuery(key);
      } catch (failure) {
        if (request.current?.controller !== controller) return;
        setError(
          controller.signal.aborted
            ? "Loading took too long. Please try again."
            : failure instanceof Error
              ? failure.message
              : "Could not load your sessions.",
        );
      } finally {
        clearTimeout(timeout);
        if (request.current?.controller === controller) {
          request.current = null;
          setLoading(false);
        }
      }
    },
    [queryKey, month],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      request.current?.controller.abort();
      request.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    const visibleRefresh = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", visibleRefresh);
    const timer = setInterval(visibleRefresh, 30_000);
    return () => {
      window.removeEventListener("focus", visibleRefresh);
      clearInterval(timer);
    };
  }, [refresh]);

  return {
    data: dataQuery === queryKey ? data : null,
    loading: loading || (dataQuery !== queryKey && !error),
    error,
    refresh,
  };
}
