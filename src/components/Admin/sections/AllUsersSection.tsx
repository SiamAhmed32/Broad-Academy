"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminEmpty,
  AdminInput,
  AdminLoading,
  AdminPagination,
  AdminSelect,
  type AdminPaginationMeta,
} from "@/components/Admin";
import {
  UserAccountModal,
  type WebsiteUserRecord,
} from "@/components/Admin/UserAccountModal";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import { cn } from "@/lib/utils";

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

type AllUsersSectionProps = {
  onTotalChange?: (total: number) => void;
};

export function AllUsersSection({ onTotalChange }: AllUsersSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [users, setUsers] = useState<WebsiteUserRecord[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>(emptyPagination);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("all");
  const [enrollment, setEnrollment] = useState("all");
  const [sort, setSort] = useState("created_desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<WebsiteUserRecord | null>(null);
  const [updating, setUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<"suspend" | "approve" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ message?: string[] }>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sort,
      role,
      enrollment,
    });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);

    const res = await adminFetch<{
      users: WebsiteUserRecord[];
      pagination: AdminPaginationMeta;
    }>(`/api/admin/users?${params}`);

    if (res.success && res.data) {
      setUsers(res.data.users);
      setPagination(res.data.pagination);
      onTotalChange?.(res.data.pagination.total);
    }
    setLoading(false);
  }, [enrollment, onTotalChange, page, role, search, sort, status]);

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(), 280);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  function openUserModal(user: WebsiteUserRecord) {
    setActionError(null);
    setFieldErrors({});
    setSelectedUser(user);
  }

  async function suspendUser(message: string) {
    if (!selectedUser || selectedUser.role !== "STUDENT") return;

    setUpdating(true);
    setPendingAction("suspend");
    setActionError(null);
    setFieldErrors({});

    const res = await adminFetch("/api/admin/students", {
      method: "PATCH",
      body: JSON.stringify({
        id: selectedUser.id,
        status: "SUSPENDED",
        message,
      }),
    });

    setUpdating(false);
    setPendingAction(null);

    if (!res.success) {
      setActionError(res.message ?? "Could not suspend this account.");
      setFieldErrors(res.fields ?? {});
      return;
    }

    setSelectedUser(null);
    await loadUsers();
  }

  async function approveUser() {
    if (!selectedUser || selectedUser.role !== "STUDENT") return;

    setUpdating(true);
    setPendingAction("approve");
    setActionError(null);
    setFieldErrors({});

    const res = await adminFetch("/api/admin/students", {
      method: "PATCH",
      body: JSON.stringify({ id: selectedUser.id, status: "ACTIVE" }),
    });

    setUpdating(false);
    setPendingAction(null);

    if (!res.success) {
      setActionError(res.message ?? "Could not approve this account.");
      return;
    }

    setSelectedUser(null);
    await loadUsers();
  }

  return (
    <>
      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <AdminCardTitle>All website accounts</AdminCardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Everyone who registered or signed in — students and staff. Filter by enrollment
            status to find who still needs course access.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
            <div className="relative lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <AdminInput
                className="pl-10"
                placeholder="Search name, email, phone, student ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <AdminSelect
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All account statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </AdminSelect>
            <AdminSelect
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All roles</option>
              <option value="STUDENT">Students only</option>
              <option value="ADMIN">Staff only</option>
            </AdminSelect>
            <AdminSelect
              value={enrollment}
              onChange={(e) => {
                setEnrollment(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Any enrollment</option>
              <option value="enrolled">Currently enrolled</option>
              <option value="pending_request">Pending course request</option>
              <option value="not_enrolled">Not enrolled</option>
            </AdminSelect>
            <AdminSelect
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="last_login_desc">Last login</option>
              <option value="enrollments_desc">Most courses</option>
            </AdminSelect>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Loading accounts..." />
        ) : users.length === 0 ? (
          <AdminEmpty
            title="No accounts found"
            description="Try changing search or filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-navy">Account</th>
                    <th className="px-5 py-3 font-semibold text-navy">Role</th>
                    <th className="px-5 py-3 font-semibold text-navy">Courses</th>
                    <th className="px-5 py-3 font-semibold text-navy">Requests</th>
                    <th className="px-5 py-3 font-semibold text-navy">Status</th>
                    <th className="px-5 py-3 font-semibold text-navy">Last login</th>
                    <th className="px-5 py-3 font-semibold text-navy">Joined</th>
                    <th className="px-5 py-3 font-semibold text-navy">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-navy">{user.fullName}</div>
                        <div className="mt-0.5 max-w-[240px] truncate text-xs text-slate-500">
                          {user.email}
                        </div>
                        {user.studentId ? (
                          <div className="mt-0.5 text-xs text-slate-400">
                            ID: {user.studentId}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge variant={user.role === "ADMIN" ? "info" : "muted"}>
                          {user.role === "ADMIN"
                            ? user.adminRole?.replace("_", " ") ?? "Staff"
                            : "Student"}
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {user._count.enrollments}
                      </td>
                      <td className="px-5 py-4">
                        {user._count.enrollmentRequests > 0 ? (
                          <AdminBadge variant="warning">
                            {user._count.enrollmentRequests} open
                          </AdminBadge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge
                          variant={user.status === "ACTIVE" ? "success" : "danger"}
                        >
                          {user.status === "ACTIVE" ? "Active" : "Suspended"}
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {user.lastLoginAt
                          ? formatAdminDate(user.lastLoginAt)
                          : "Never"}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatAdminDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActionError(null);
                            openUserModal(user);
                          }}
                        >
                          Manage
                        </AdminButton>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </AdminCard>

      <UserAccountModal
        user={selectedUser}
        isLoading={updating}
        loadingAction={pendingAction}
        errorMessage={actionError}
        fieldErrors={fieldErrors}
        onClose={() => {
          if (updating) return;
          setSelectedUser(null);
          setActionError(null);
          setFieldErrors({});
        }}
        onSuspend={(message) => void suspendUser(message)}
        onApprove={() => void approveUser()}
      />
    </>
  );
}

export function PeopleTabButton({
  active,
  onClick,
  label,
  description,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  count?: number | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[180px] flex-1 flex-col rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-navy bg-navy text-white shadow-md"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {count != null ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {count.toLocaleString()}
          </span>
        ) : null}
      </span>
      {description ? (
        <span
          className={cn(
            "mt-1 text-xs leading-5",
            active ? "text-white/75" : "text-slate-500",
          )}
        >
          {description}
        </span>
      ) : null}
    </button>
  );
}
