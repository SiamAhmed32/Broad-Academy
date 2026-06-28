"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminEnrollmentsPage from "@/components/Admin/pages/AdminEnrollmentsPage";
import {
  AllUsersSection,
  PeopleTabButton,
} from "@/components/Admin/sections/AllUsersSection";
import { AdminPageHeader } from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";

export type PeopleTab = "users" | "requests" | "enrolled";

type AdminPeoplePageProps = {
  defaultTab?: PeopleTab;
  canViewUsers?: boolean;
  canViewEnrollments?: boolean;
};

export default function AdminPeoplePage({
  defaultTab = "users",
  canViewUsers = true,
  canViewEnrollments = true,
}: AdminPeoplePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = useMemo(() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl === "users" || fromUrl === "requests" || fromUrl === "enrolled") {
      return fromUrl;
    }
    if (searchParams.get("request")) return "requests";
    return defaultTab;
  }, [defaultTab, searchParams]);

  const [activeTab, setActiveTab] = useState<PeopleTab>(initialTab);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const selectTab = useCallback(
    (tab: PeopleTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/admin/students?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!canViewEnrollments) return;
    void (async () => {
      const [requestsRes, enrollmentsRes] = await Promise.all([
        adminFetch<{ pagination: { total: number } }>(
          "/api/admin/enrollment-requests?limit=1&page=1",
        ),
        adminFetch<{ pagination: { total: number } }>(
          "/api/admin/enrollments?limit=1&page=1",
        ),
      ]);
      if (requestsRes.success && requestsRes.data) {
        setRequestCount(requestsRes.data.pagination.total);
      }
      if (enrollmentsRes.success && enrollmentsRes.data) {
        setEnrolledCount(enrollmentsRes.data.pagination.total);
      }
    })();
  }, [canViewEnrollments]);

  const visibleTabs = [
    canViewUsers
      ? {
          id: "users" as const,
          label: "All users",
          description: "Registered accounts with search & filters",
          count: userCount,
        }
      : null,
    canViewEnrollments
      ? {
          id: "requests" as const,
          label: "Course requests",
          description: "bKash payment verification queue",
          count: requestCount,
        }
      : null,
    canViewEnrollments
      ? {
          id: "enrolled" as const,
          label: "Enrolled",
          description: "Students with active course access",
          count: enrolledCount,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: PeopleTab;
    label: string;
    description: string;
    count: number | null;
  }>;

  const resolvedTab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? "users");

  return (
    <div>
      <AdminPageHeader
        title="People & access"
        description="Separate views for website accounts, course enrollment requests, and students who already have access."
      />

      {visibleTabs.length > 1 ? (
        <div className="mb-6 flex flex-col gap-3 lg:flex-row">
          {visibleTabs.map((tab) => (
            <PeopleTabButton
              key={tab.id}
              active={resolvedTab === tab.id}
              onClick={() => selectTab(tab.id)}
              label={tab.label}
              description={tab.description}
              count={tab.count}
            />
          ))}
        </div>
      ) : null}

      {resolvedTab === "users" && canViewUsers ? (
        <AllUsersSection onTotalChange={setUserCount} />
      ) : null}

      {resolvedTab === "requests" && canViewEnrollments ? (
        <AdminEnrollmentsPage
          section="queue"
          showPageHeader={false}
          showGrantForm
          onQueueTotalChange={setRequestCount}
        />
      ) : null}

      {resolvedTab === "enrolled" && canViewEnrollments ? (
        <AdminEnrollmentsPage
          section="enrollments"
          showPageHeader={false}
          showGrantForm={false}
          onEnrollmentTotalChange={setEnrolledCount}
        />
      ) : null}
    </div>
  );
}
