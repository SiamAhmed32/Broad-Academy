"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import EnrollmentRequestDetailModal, {
  type EnrollmentRequestDetail,
} from "@/components/Admin/EnrollmentRequestDetailModal";
import EnrollmentGuideSettings from "@/components/Admin/EnrollmentGuideSettings";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminConfirmDialog,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  type AdminPaginationMeta,
  AdminSelect,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import {
  enrollmentRequestStatusLabel,
  type EnrollmentRequestStatus,
} from "@/lib/enrollments/status";
import { cn } from "@/lib/utils";

type Student = { id: string; fullName: string; email: string };
type Course = { id: string; title: string };
type Enrollment = {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  enrolledAt: string;
  source: "MANUAL_PAYMENT" | "ADMIN_DIRECT" | "LEGACY";
  grantNote: string | null;
  grantedBy: { fullName: string } | null;
  user: { id: string; fullName: string; email: string };
  course: { id: string; title: string };
};

const enrollmentStatusVariant = {
  ACTIVE: "success" as const,
  COMPLETED: "info" as const,
  CANCELLED: "danger" as const,
  EXPIRED: "warning" as const,
};

const requestStatusVariant = {
  PENDING: "warning" as const,
  REVIEWING: "info" as const,
  APPROVED: "success" as const,
  REJECTED: "danger" as const,
  CANCELLED: "danger" as const,
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 15,
  total: 0,
  totalPages: 1,
};

export default function AdminEnrollmentsPage({
  section,
  showPageHeader = true,
  showGrantForm = true,
  onQueueTotalChange,
  onEnrollmentTotalChange,
}: {
  section?: "queue" | "enrollments";
  showPageHeader?: boolean;
  showGrantForm?: boolean;
  onQueueTotalChange?: (total: number) => void;
  onEnrollmentTotalChange?: (total: number) => void;
} = {}) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkRequestId = searchParams.get("request");

  const [activeTab, setActiveTab] = useState<"queue" | "enrollments">(
    section ?? "queue",
  );
  const [courses, setCourses] = useState<Course[]>([]);

  const [requests, setRequests] = useState<EnrollmentRequestDetail[]>([]);
  const [requestPagination, setRequestPagination] =
    useState<AdminPaginationMeta>(emptyPagination);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [requestCourseId, setRequestCourseId] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentPagination, setEnrollmentPagination] =
    useState<AdminPaginationMeta>(emptyPagination);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
  const [enrollmentCourseId, setEnrollmentCourseId] = useState("");
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] =
    useState<EnrollmentRequestDetail | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(
    null,
  );
  const [revokeTarget, setRevokeTarget] = useState<Enrollment | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    const params = new URLSearchParams({
      page: String(requestPage),
      limit: "15",
    });
    if (requestSearch.trim()) params.set("search", requestSearch.trim());
    if (requestStatus) params.set("status", requestStatus);
    if (requestCourseId) params.set("courseId", requestCourseId);

    const res = await adminFetch<{
      requests: EnrollmentRequestDetail[];
      pagination: AdminPaginationMeta;
    }>(`/api/admin/enrollment-requests?${params}`);

    if (res.success && res.data) {
      setRequests(res.data.requests);
      setRequestPagination(res.data.pagination);
      onQueueTotalChange?.(res.data.pagination.total);
    }
    setRequestsLoading(false);
  }, [onQueueTotalChange, requestCourseId, requestPage, requestSearch, requestStatus]);

  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    const params = new URLSearchParams({
      page: String(enrollmentPage),
      limit: "15",
    });
    if (enrollmentSearch.trim()) params.set("search", enrollmentSearch.trim());
    if (enrollmentStatus) params.set("status", enrollmentStatus);
    if (enrollmentCourseId) params.set("courseId", enrollmentCourseId);

    const res = await adminFetch<{
      enrollments: Enrollment[];
      pagination: AdminPaginationMeta;
    }>(`/api/admin/enrollments?${params}`);

    if (res.success && res.data) {
      setEnrollments(res.data.enrollments);
      setEnrollmentPagination(res.data.pagination);
      onEnrollmentTotalChange?.(res.data.pagination.total);
    }
    setEnrollmentsLoading(false);
  }, [enrollmentCourseId, enrollmentPage, enrollmentSearch, enrollmentStatus, onEnrollmentTotalChange]);

  useEffect(() => {
    if (section === "enrollments") return;
    const timer = setTimeout(() => void loadRequests(), 280);
    return () => clearTimeout(timer);
  }, [loadRequests, section]);

  useEffect(() => {
    if (section === "queue") return;
    const timer = setTimeout(() => void loadEnrollments(), 280);
    return () => clearTimeout(timer);
  }, [loadEnrollments, section]);

  useEffect(() => {
    adminFetch<{ courses: Course[] }>("/api/admin/courses?limit=100&compact=true").then((res) => {
      if (res.success && res.data) setCourses(res.data.courses);
    });
  }, []);

  useEffect(() => {
    if (!emailSearch.trim()) return;
    const timer = setTimeout(async () => {
      const res = await adminFetch<{ students: Student[] }>(
        `/api/admin/students?search=${encodeURIComponent(emailSearch.trim())}&limit=10`,
      );
      if (res.success && res.data) setStudents(res.data.students);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailSearch]);

  useEffect(() => {
    if (!deepLinkRequestId) return;
    void (async () => {
      const res = await adminFetch<{
        requests: EnrollmentRequestDetail[];
      }>(`/api/admin/enrollment-requests?id=${encodeURIComponent(deepLinkRequestId)}`);
      if (res.success && res.data?.requests[0]) {
        setSelectedRequest(res.data.requests[0]);
      }
    })();
  }, [deepLinkRequestId]);

  function closeRequestModal() {
    setSelectedRequest(null);
    if (deepLinkRequestId) {
      router.replace("/admin/students?tab=requests", { scroll: false });
    }
  }

  async function grantAccess(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUserId || !selectedCourseId || grantNote.trim().length < 3) return;
    setSaving(true);
    const res = await adminFetch("/api/admin/enrollments", {
      method: "POST",
      body: JSON.stringify({
        userId: selectedUserId,
        courseId: selectedCourseId,
        grantNote: grantNote.trim(),
      }),
    });
    setSaving(false);
    if (res.success) {
      setEmailSearch("");
      setSelectedUserId("");
      setSelectedCourseId("");
      setGrantNote("");
      void loadEnrollments();
    }
  }

  async function reviewRequest(
    request: EnrollmentRequestDetail,
    action: "REVIEWING" | "APPROVE" | "REJECT",
    reviewNote: string | null,
  ) {
    setReviewing(true);
    const res = await adminFetch<EnrollmentRequestDetail>(
      "/api/admin/enrollment-requests",
      {
      method: "PATCH",
      body: JSON.stringify({ id: request.id, action, reviewNote }),
      },
    );
    setReviewing(false);
    if (res.success && res.data) {
      const updatedRequest = res.data;
      setRequests((current) =>
        current.map((item) =>
          item.id === updatedRequest.id ? updatedRequest : item,
        ),
      );

      if (action === "REVIEWING") {
        setSelectedRequest(updatedRequest);
        await loadRequests();
      } else {
        closeRequestModal();
        await Promise.all([loadRequests(), loadEnrollments()]);
      }
    }
  }

  async function revokeAccess(enrollment: Enrollment) {
    setRevoking(enrollment.id);
    await adminFetch("/api/admin/enrollments", {
      method: "PATCH",
      body: JSON.stringify({ id: enrollment.id, status: "CANCELLED" }),
    });
    setRevoking(null);
    setRevokeTarget(null);
    setSelectedEnrollment(null);
    void loadEnrollments();
  }

  const visibleTab = section ?? activeTab;

  return (
    <div>
      {showPageHeader ? (
        <AdminPageHeader
          title="Course access"
          description="Review payment proofs at scale with search, filters, and pagination. Open details in a modal to approve or reject."
        />
      ) : null}

      {showGrantForm && visibleTab === "queue" ? <EnrollmentGuideSettings /> : null}

      {showGrantForm && visibleTab === "queue" ? (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AdminCard className="mb-6">
          <AdminCardTitle>Special-case direct access</AdminCardTitle>
          <p className="mt-2 text-sm text-slate-500">
            Grant documented access without a bKash submission. Every action is audited.
          </p>
          <form onSubmit={grantAccess} className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminField label="Find student by email">
              <AdminInput
                value={emailSearch}
                onChange={(e) => {
                  setEmailSearch(e.target.value);
                  setSelectedUserId("");
                  if (!e.target.value.trim()) setStudents([]);
                }}
                placeholder="student@example.com"
              />
            </AdminField>
            <AdminField label="Select student">
              <AdminSelect
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Choose a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.email})
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Course">
              <AdminSelect
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Reason for direct access">
              <AdminInput
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="Scholarship, offline payment, staff exception..."
              />
            </AdminField>
            <div className="flex items-end lg:col-span-2">
              <AdminButton
                type="submit"
                isLoading={saving}
                disabled={
                  !selectedUserId || !selectedCourseId || grantNote.trim().length < 3
                }
              >
                Grant access
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      </motion.div>
      ) : null}

      {!section ? (
      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <TabButton
          active={activeTab === "queue"}
          onClick={() => setActiveTab("queue")}
          label="Payment queue"
          count={requestPagination.total}
        />
        <TabButton
          active={activeTab === "enrollments"}
          onClick={() => setActiveTab("enrollments")}
          label="Active enrollments"
          count={enrollmentPagination.total}
        />
      </div>
      ) : null}

      {visibleTab === "queue" ? (
        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <AdminCardTitle>Payment verification queue</AdminCardTitle>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <AdminInput
                  className="pl-10"
                  placeholder="Search name, email, phone, transaction ID..."
                  value={requestSearch}
                  onChange={(e) => {
                    setRequestSearch(e.target.value);
                    setRequestPage(1);
                  }}
                />
              </div>
              <AdminSelect
                value={requestStatus}
                onChange={(e) => {
                  setRequestStatus(e.target.value);
                  setRequestPage(1);
                }}
              >
                <option value="">All statuses</option>
                <option value="PENDING">{enrollmentRequestStatusLabel.PENDING}</option>
                <option value="REVIEWING">{enrollmentRequestStatusLabel.REVIEWING}</option>
                <option value="APPROVED">{enrollmentRequestStatusLabel.APPROVED}</option>
                <option value="REJECTED">{enrollmentRequestStatusLabel.REJECTED}</option>
              </AdminSelect>
              <AdminSelect
                value={requestCourseId}
                onChange={(e) => {
                  setRequestCourseId(e.target.value);
                  setRequestPage(1);
                }}
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </div>

          {requestsLoading ? (
            <AdminLoading label="Loading payment requests..." />
          ) : requests.length === 0 ? (
            <AdminEmpty
              title="No payment requests"
              description="Try changing filters or wait for new bKash submissions."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-navy">Student</th>
                      <th className="px-5 py-3 font-semibold text-navy">Course</th>
                      <th className="px-5 py-3 font-semibold text-navy">Status</th>
                      <th className="px-5 py-3 font-semibold text-navy">Submitted</th>
                      <th className="px-5 py-3 text-right font-semibold text-navy">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => (
                      <motion.tr
                        key={request.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "border-b border-slate-100 last:border-0 hover:bg-slate-50/70",
                          request.id === deepLinkRequestId && "bg-amber-50/80",
                        )}
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-navy">{request.user.fullName}</div>
                          <div className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                            {request.user.email}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="max-w-[200px] truncate font-medium text-navy">
                            {request.course.title}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            ৳{request.paidAmount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <AdminBadge variant={requestStatusVariant[request.status]}>
                            {enrollmentRequestStatusLabel[
                              request.status as EnrollmentRequestStatus
                            ]}
                          </AdminBadge>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {formatAdminDate(request.submittedAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(request)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy transition hover:border-btnBg/40 hover:bg-btnBg/5 hover:text-btnBg"
                            aria-label={`View details for ${request.user.fullName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                pagination={requestPagination}
                onPageChange={setRequestPage}
              />
            </>
          )}
        </AdminCard>
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <AdminCardTitle>Active enrollments</AdminCardTitle>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <AdminInput
                  className="pl-10"
                  placeholder="Search student or course..."
                  value={enrollmentSearch}
                  onChange={(e) => {
                    setEnrollmentSearch(e.target.value);
                    setEnrollmentPage(1);
                  }}
                />
              </div>
              <AdminSelect
                value={enrollmentStatus}
                onChange={(e) => {
                  setEnrollmentStatus(e.target.value);
                  setEnrollmentPage(1);
                }}
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </AdminSelect>
              <AdminSelect
                value={enrollmentCourseId}
                onChange={(e) => {
                  setEnrollmentCourseId(e.target.value);
                  setEnrollmentPage(1);
                }}
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </div>

          {enrollmentsLoading ? (
            <AdminLoading label="Loading enrollments..." />
          ) : enrollments.length === 0 ? (
            <AdminEmpty
              title="No enrollments found"
              description="Approved students and manually granted access appear here."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-navy">Student</th>
                      <th className="px-5 py-3 font-semibold text-navy">Course</th>
                      <th className="px-5 py-3 font-semibold text-navy">Status</th>
                      <th className="px-5 py-3 font-semibold text-navy">Enrolled</th>
                      <th className="px-5 py-3 text-right font-semibold text-navy">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-navy">{row.user.fullName}</div>
                          <div className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                            {row.user.email}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{row.course.title}</td>
                        <td className="px-5 py-4">
                          <AdminBadge variant={enrollmentStatusVariant[row.status]}>
                            {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                          </AdminBadge>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {formatAdminDate(row.enrolledAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEnrollment(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy transition hover:border-btnBg/40 hover:bg-btnBg/5 hover:text-btnBg"
                            aria-label={`View enrollment for ${row.user.fullName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                pagination={enrollmentPagination}
                onPageChange={setEnrollmentPage}
              />
            </>
          )}
        </AdminCard>
      )}

      <EnrollmentRequestDetailModal
        request={selectedRequest}
        reviewing={reviewing}
        onClose={closeRequestModal}
        onReview={reviewRequest}
      />

      {selectedEnrollment ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-navy/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelectedEnrollment(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-[1.75rem] bg-white p-6 shadow-2xl sm:rounded-[1.75rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Enrollment details
                </p>
                <h3 className="mt-1 text-lg font-semibold text-navy">
                  {selectedEnrollment.user.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnrollment(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Email" value={selectedEnrollment.user.email} />
              <Row label="Course" value={selectedEnrollment.course.title} />
              <Row label="Status" value={selectedEnrollment.status} />
              <Row
                label="Source"
                value={
                  selectedEnrollment.source === "ADMIN_DIRECT"
                    ? "Special case"
                    : selectedEnrollment.source === "MANUAL_PAYMENT"
                      ? "Verified bKash"
                      : "Legacy"
                }
              />
              {selectedEnrollment.grantNote ? (
                <Row label="Note" value={selectedEnrollment.grantNote} />
              ) : null}
              {selectedEnrollment.grantedBy ? (
                <Row label="Granted by" value={selectedEnrollment.grantedBy.fullName} />
              ) : null}
              <Row
                label="Enrolled"
                value={formatAdminDate(selectedEnrollment.enrolledAt)}
              />
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              {selectedEnrollment.status === "ACTIVE" ? (
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => setRevokeTarget(selectedEnrollment)}
                >
                  Revoke access
                </AdminButton>
              ) : null}
              <AdminButton variant="ghost" size="sm" onClick={() => setSelectedEnrollment(null)}>
                Close
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke course access?"
        description={
          revokeTarget
            ? `Remove access for ${revokeTarget.user.fullName} on ${revokeTarget.course.title}. They will no longer be able to open lessons.`
            : ""
        }
        confirmLabel="Revoke access"
        cancelLabel="Keep access"
        variant="danger"
        isLoading={Boolean(revokeTarget && revoking === revokeTarget.id)}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) void revokeAccess(revokeTarget);
        }}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-semibold transition",
        active ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-2 rounded-full px-2 py-0.5 text-xs",
          active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {count.toLocaleString()}
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
