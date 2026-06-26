"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import type { AdminStaffRole } from "@/generated/prisma/client";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminSelect,
} from "@/components/Admin";
import {
  ADMIN_ROLE_LABELS,
  STAFF_ROLE_DESCRIPTIONS,
} from "@/lib/admin/permissions";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  adminRole: AdminStaffRole;
  status: "ACTIVE" | "SUSPENDED";
  lastLoginAt: string | null;
  createdAt: string;
};

type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type TeamData = {
  staff: StaffMember[];
  candidates: Candidate[];
  actor: {
    id: string;
    role: AdminStaffRole;
    assignableRoles: AdminStaffRole[];
  };
};

export default function AdminTeamPage() {
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AdminStaffRole>>({});
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(
    null,
  );

  const loadTeam = useCallback(async (query = "") => {
    const url = query
      ? `/api/admin/team?search=${encodeURIComponent(query)}`
      : "/api/admin/team";
    const response = await adminFetch<TeamData>(url);
    if (response.success && response.data) {
      setData(response.data);
      setSelectedRoles((current) => {
        const next = { ...current };
        response.data!.candidates.forEach((candidate) => {
          next[candidate.id] ??= response.data!.actor.assignableRoles[0];
        });
        return next;
      });
    } else {
      setMessage({ text: response.message ?? "Could not load team.", error: true });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTeam().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTeam]);

  async function findStudents(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    if (query.length < 2) {
      setMessage({ text: "Enter at least 2 characters.", error: true });
      return;
    }
    setSearching(true);
    await loadTeam(query);
    setSearching(false);
  }

  async function promote(candidate: Candidate) {
    const role = selectedRoles[candidate.id];
    if (!role) return;
    setUpdating(candidate.id);
    const response = await adminFetch("/api/admin/team", {
      method: "POST",
      body: JSON.stringify({ userId: candidate.id, adminRole: role }),
    });
    setUpdating(null);
    setMessage({
      text: response.message ?? (response.success ? "Access granted." : "Could not grant access."),
      error: !response.success,
    });
    if (response.success) {
      setSearch("");
      await loadTeam();
    }
  }

  async function updateRole(member: StaffMember, adminRole: AdminStaffRole) {
    setUpdating(member.id);
    const response = await adminFetch("/api/admin/team", {
      method: "PATCH",
      body: JSON.stringify({ userId: member.id, adminRole }),
    });
    setUpdating(null);
    setMessage({
      text: response.message ?? (response.success ? "Role updated." : "Could not update role."),
      error: !response.success,
    });
    if (response.success) await loadTeam();
  }

  async function removeAccess(member: StaffMember) {
    if (
      !window.confirm(
        `Remove staff access from ${member.fullName}? Their account will become a student account.`,
      )
    ) {
      return;
    }
    setUpdating(member.id);
    const response = await adminFetch("/api/admin/team", {
      method: "DELETE",
      body: JSON.stringify({ userId: member.id }),
    });
    setUpdating(null);
    setMessage({
      text: response.message ?? (response.success ? "Access removed." : "Could not remove access."),
      error: !response.success,
    });
    if (response.success) await loadTeam();
  }

  if (loading) return <AdminLoading label="Loading team access..." />;
  if (!data) return <AdminEmpty title="Team unavailable" description="Refresh the page and try again." />;

  return (
    <div>
      <AdminPageHeader
        title="Team & access"
        description="Promote verified student accounts to staff and assign a controlled operational role."
      />

      {message ? (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            message.error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.actor.assignableRoles.map((role) => (
          <div key={role} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <p className="mt-3 text-sm font-semibold text-navy">
              {ADMIN_ROLE_LABELS[role]}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {STAFF_ROLE_DESCRIPTIONS[role]}
            </p>
          </div>
        ))}
      </div>

      <AdminCard className="mb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-btnBg/10 text-btnBg">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold text-navy">Grant staff access</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search an active student by name or email. Promotion updates both
              account type and staff role atomically.
            </p>
            <form onSubmit={findStudents} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AdminInput
                value={search}
                onChange={(event) => setSearch(event.target.value.slice(0, 100))}
                placeholder="Search student name or email"
                aria-label="Search students"
              />
              <AdminButton type="submit" isLoading={searching}>
                <Search className="h-4 w-4" /> Search
              </AdminButton>
            </form>
          </div>
        </div>

        {data.candidates.length ? (
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
            {data.candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{candidate.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{candidate.email}</p>
                </div>
                <AdminSelect
                  value={selectedRoles[candidate.id] ?? data.actor.assignableRoles[0]}
                  onChange={(event) =>
                    setSelectedRoles((current) => ({
                      ...current,
                      [candidate.id]: event.target.value as AdminStaffRole,
                    }))
                  }
                  className="lg:w-48"
                  aria-label={`Staff role for ${candidate.fullName}`}
                >
                  {data.actor.assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ADMIN_ROLE_LABELS[role]}
                    </option>
                  ))}
                </AdminSelect>
                <AdminButton
                  onClick={() => promote(candidate)}
                  isLoading={updating === candidate.id}
                >
                  Grant access
                </AdminButton>
              </div>
            ))}
          </div>
        ) : null}
      </AdminCard>

      {data.staff.length === 0 ? (
        <AdminEmpty title="No staff members" description="Promoted accounts will appear here." />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-btnBg" />
              <h2 className="font-semibold text-navy">Current staff</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-navy">Staff member</th>
                  <th className="px-5 py-3 font-semibold text-navy">Role</th>
                  <th className="px-5 py-3 font-semibold text-navy">Status</th>
                  <th className="px-5 py-3 font-semibold text-navy">Last login</th>
                  <th className="px-5 py-3 text-right font-semibold text-navy">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.staff.map((member, index) => {
                  const editable =
                    member.id !== data.actor.id &&
                    member.adminRole !== "OWNER" &&
                    !(
                      data.actor.role === "ADMIN" &&
                      member.adminRole === "ADMIN"
                    );
                  return (
                    <motion.tr
                      key={member.id}
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.025 }}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-navy">{member.fullName}</p>
                        <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        {editable ? (
                          <AdminSelect
                            className="min-w-[160px]"
                            value={member.adminRole}
                            disabled={updating === member.id}
                            onChange={(event) =>
                              updateRole(
                                member,
                                event.target.value as AdminStaffRole,
                              )
                            }
                            aria-label={`Role for ${member.fullName}`}
                          >
                            {data.actor.assignableRoles.map((role) => (
                              <option key={role} value={role}>
                                {ADMIN_ROLE_LABELS[role]}
                              </option>
                            ))}
                          </AdminSelect>
                        ) : (
                          <AdminBadge variant="info">
                            {ADMIN_ROLE_LABELS[member.adminRole]}
                          </AdminBadge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge variant={member.status === "ACTIVE" ? "success" : "danger"}>
                          {member.status === "ACTIVE" ? "Active" : "Suspended"}
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {member.lastLoginAt ? formatAdminDate(member.lastLoginAt) : "Never"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {editable ? (
                          <button
                            type="button"
                            onClick={() => removeAccess(member)}
                            disabled={updating === member.id}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" /> Remove access
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {member.id === data.actor.id ? "Your account" : "Protected"}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
