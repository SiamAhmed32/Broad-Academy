"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ShieldAlert, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminBadge, AdminButton } from "@/components/Admin";
import { AdminField, AdminTextarea } from "@/components/Admin/ui/AdminField";
import { formatAdminDate } from "@/lib/admin/client";
import { cn } from "@/lib/utils";

export type WebsiteUserRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "STUDENT" | "ADMIN";
  adminRole: string | null;
  status: "ACTIVE" | "SUSPENDED";
  studentId: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  _count: {
    enrollments: number;
    enrollmentRequests: number;
  };
};

/** @deprecated Use WebsiteUserRecord */
export type StudentAccountRecord = Pick<
  WebsiteUserRecord,
  "id" | "fullName" | "email" | "phone" | "status" | "createdAt" | "_count"
>;

type UserAccountModalProps = {
  user: WebsiteUserRecord | null;
  isLoading: boolean;
  loadingAction?: "suspend" | "approve" | null;
  errorMessage?: string | null;
  fieldErrors?: { message?: string[] };
  onClose: () => void;
  onSuspend: (message: string) => void;
  onApprove: () => void;
};

export function UserAccountModal({
  user,
  isLoading,
  loadingAction = null,
  errorMessage,
  fieldErrors,
  onClose,
  onSuspend,
  onApprove,
}: UserAccountModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [suspendMessage, setSuspendMessage] = useState("");
  const [localMessageError, setLocalMessageError] = useState("");

  useEffect(() => {
    if (!user) return;
    setSuspendMessage("");
    setLocalMessageError("");
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user, isLoading, onClose]);

  const isActive = user?.status === "ACTIVE";
  const isStudent = user?.role === "STUDENT";
  const messageError =
    localMessageError || fieldErrors?.message?.[0] || "";

  function handleSuspend() {
    const trimmed = suspendMessage.trim();
    if (trimmed.length < 10) {
      setLocalMessageError("Write at least 10 characters for the student.");
      return;
    }
    setLocalMessageError("");
    onSuspend(trimmed);
  }

  return (
    <AnimatePresence>
      {user ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
          onClick={isLoading ? undefined : onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-account-modal-title"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="user-account-modal-title"
                  className="text-lg font-semibold text-navy"
                >
                  Manage account
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isStudent
                    ? "Suspend access or approve the account again."
                    : "Staff accounts are managed under Team & Roles."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-btnBg/10 text-btnBg">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{user.fullName}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{user.email}</p>
                  {user.phone ? (
                    <p className="mt-0.5 text-sm text-slate-500">{user.phone}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <AdminBadge variant={isActive ? "success" : "danger"}>
                      {isActive ? "Active" : "Suspended"}
                    </AdminBadge>
                    <AdminBadge variant={user.role === "ADMIN" ? "info" : "muted"}>
                      {user.role === "ADMIN"
                        ? user.adminRole?.replace("_", " ") ?? "Staff"
                        : "Student"}
                    </AdminBadge>
                    <span>{user._count.enrollments} course(s)</span>
                    {user._count.enrollmentRequests > 0 ? (
                      <span>{user._count.enrollmentRequests} open request(s)</span>
                    ) : null}
                    <span>Joined {formatAdminDate(user.createdAt)}</span>
                    {user.lastLoginAt ? (
                      <span>Last login {formatAdminDate(user.lastLoginAt)}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {isStudent ? (
                <div className="space-y-3">
                  <div
                    className={cn(
                      "rounded-2xl border p-4 transition",
                      !isActive || isLoading
                        ? "border-slate-200 bg-slate-50/60 opacity-70"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy">Suspend account</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          The student will be signed out and cannot log in until you
                          approve the account again. Your message is emailed and sent as
                          an in-app notification.
                        </p>

                        {isActive ? (
                          <div className="mt-4">
                            <AdminField
                              label="Message to student"
                              hint="This message is emailed to the student and saved in their notifications."
                              error={messageError}
                            >
                              <AdminTextarea
                                rows={4}
                                value={suspendMessage}
                                invalid={Boolean(messageError)}
                                maxLength={1000}
                                placeholder="Explain why the account is being suspended and what the student should do next..."
                                onChange={(event) => {
                                  setSuspendMessage(event.target.value);
                                  if (localMessageError) setLocalMessageError("");
                                }}
                              />
                            </AdminField>
                          </div>
                        ) : null}

                        <AdminButton
                          className="mt-4"
                          size="sm"
                          variant="danger"
                          disabled={!isActive || isLoading}
                          isLoading={isLoading && loadingAction === "suspend"}
                          onClick={handleSuspend}
                        >
                          Suspend account
                        </AdminButton>
                      </div>
                    </div>
                  </div>

                  <ActionCard
                    icon={CheckCircle2}
                    title="Approve account again"
                    description="Restore full access so the student can sign in, use courses, and submit documents. The student receives an email and notification."
                    tone="success"
                    disabled={isActive || isLoading}
                    buttonLabel="Approve account"
                    onAction={onApprove}
                    isLoading={isLoading && loadingAction === "approve"}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Use the Team & Roles page to change staff permissions or roles.
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <AdminButton variant="ghost" onClick={onClose} disabled={isLoading}>
                Close
              </AdminButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  tone,
  disabled,
  buttonLabel,
  onAction,
  isLoading,
}: {
  icon: typeof ShieldAlert;
  title: string;
  description: string;
  tone: "danger" | "success";
  disabled: boolean;
  buttonLabel: string;
  onAction: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition",
        disabled ? "border-slate-200 bg-slate-50/60 opacity-70" : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          <AdminButton
            className="mt-3"
            size="sm"
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={disabled}
            isLoading={isLoading}
            onClick={onAction}
          >
            {buttonLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
