"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ShieldAlert, UserRound, X } from "lucide-react";
import { useEffect } from "react";

import {
  AdminBadge,
  AdminButton,
} from "@/components/Admin";
import { formatAdminDate } from "@/lib/admin/client";
import { cn } from "@/lib/utils";

export type StudentAccountRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  _count: { enrollments: number };
};

type StudentAccountModalProps = {
  student: StudentAccountRecord | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSuspend: () => void;
  onApprove: () => void;
};

export function StudentAccountModal({
  student,
  isLoading,
  errorMessage,
  onClose,
  onSuspend,
  onApprove,
}: StudentAccountModalProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!student) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [student, isLoading, onClose]);

  const isActive = student?.status === "ACTIVE";

  return (
    <AnimatePresence>
      {student ? (
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
            aria-labelledby="student-account-modal-title"
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
                  id="student-account-modal-title"
                  className="text-lg font-semibold text-navy"
                >
                  Manage student account
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Suspend access or approve the account again.
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
                  <p className="font-semibold text-navy">{student.fullName}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{student.email}</p>
                  {student.phone ? (
                    <p className="mt-0.5 text-sm text-slate-500">{student.phone}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <AdminBadge variant={isActive ? "success" : "danger"}>
                      {isActive ? "Active" : "Suspended"}
                    </AdminBadge>
                    <span>{student._count.enrollments} course(s)</span>
                    <span>Joined {formatAdminDate(student.createdAt)}</span>
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="space-y-3">
                <ActionCard
                  icon={ShieldAlert}
                  title="Suspend account"
                  description="The student will be signed out and cannot log in until you approve the account again."
                  tone="danger"
                  disabled={!isActive || isLoading}
                  buttonLabel="Suspend account"
                  onAction={onSuspend}
                  isLoading={isLoading && isActive}
                />

                <ActionCard
                  icon={CheckCircle2}
                  title="Approve account again"
                  description="Restore full access so the student can sign in, use courses, and submit documents."
                  tone="success"
                  disabled={isActive || isLoading}
                  buttonLabel="Approve account"
                  onAction={onApprove}
                  isLoading={isLoading && !isActive}
                />
              </div>
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
