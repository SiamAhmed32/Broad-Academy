"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type Student = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string | null;
  _count: { enrollments: number };
};

export default function AdminStudentsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (search.trim()) params.set("search", search.trim());
    const res = await adminFetch<{ students: Student[] }>(`/api/admin/students?${params}`);
    if (res.success && res.data) setStudents(res.data.students);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadStudents, 300);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  async function toggleStatus(student: Student) {
    const next = student.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const label = next === "SUSPENDED" ? "suspend" : "reactivate";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${student.fullName}?`)) return;
    setUpdating(student.id);
    const res = await adminFetch("/api/admin/students", {
      method: "PATCH",
      body: JSON.stringify({ id: student.id, status: next }),
    });
    setUpdating(null);
    if (res.success) loadStudents();
  }

  return (
    <div>
      <AdminPageHeader
        title="Students"
        description="View registered students and suspend or reactivate accounts."
      />

      <AdminCard className="mb-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <AdminInput
            className="pl-10"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </AdminCard>

      {loading ? (
        <AdminLoading label="Loading students..." />
      ) : students.length === 0 ? (
        <AdminEmpty title="No students found" description="Try a different search term." />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-navy">Name</th>
                  <th className="px-5 py-3 font-semibold text-navy">Email</th>
                  <th className="px-5 py-3 font-semibold text-navy">Courses</th>
                  <th className="px-5 py-3 font-semibold text-navy">Status</th>
                  <th className="px-5 py-3 font-semibold text-navy">Joined</th>
                  <th className="px-5 py-3 font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-navy">{student.fullName}</td>
                    <td className="px-5 py-4 text-slate-600">{student.email}</td>
                    <td className="px-5 py-4 text-slate-600">{student._count.enrollments}</td>
                    <td className="px-5 py-4">
                      <AdminBadge variant={student.status === "ACTIVE" ? "success" : "danger"}>
                        {student.status === "ACTIVE" ? "Active" : "Suspended"}
                      </AdminBadge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatAdminDate(student.createdAt)}</td>
                    <td className="px-5 py-4">
                      <AdminButton
                        size="sm"
                        variant={student.status === "ACTIVE" ? "danger" : "primary"}
                        isLoading={updating === student.id}
                        onClick={() => toggleStatus(student)}
                      >
                        {student.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                      </AdminButton>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
