"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminButton } from "@/components/Admin";
import { AdminField, AdminTextarea } from "@/components/Admin/ui/AdminField";
import { cn } from "@/lib/utils";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "success";
  note?: {
    label: string;
    placeholder?: string;
    hint?: string;
    required?: boolean;
  };
  isLoading?: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
};

const variantIcon = {
  primary: null,
  danger: AlertTriangle,
  success: CheckCircle2,
};

const confirmVariant = {
  primary: "primary" as const,
  danger: "danger" as const,
  success: "primary" as const,
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  note,
  isLoading = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const [noteValue, setNoteValue] = useState("");
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    if (open) {
      setNoteValue("");
      setNoteError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onCancel]);

  const Icon = variantIcon[variant];

  function handleConfirm() {
    if (note?.required && !noteValue.trim()) {
      setNoteError("This field is required.");
      return;
    }
    onConfirm(noteValue.trim());
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
          onClick={isLoading ? undefined : onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            aria-describedby="admin-confirm-description"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {Icon ? (
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    variant === "danger" && "bg-red-50 text-red-600",
                    variant === "success" && "bg-emerald-50 text-emerald-600",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2
                  id="admin-confirm-title"
                  className="text-lg font-semibold text-navy"
                >
                  {title}
                </h2>
                <p
                  id="admin-confirm-description"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {note ? (
              <div className="mt-5">
                <AdminField
                  label={note.label}
                  hint={note.hint}
                  error={noteError}
                >
                  <AdminTextarea
                    rows={3}
                    value={noteValue}
                    onChange={(event) => {
                      setNoteValue(event.target.value);
                      if (noteError) setNoteError("");
                    }}
                    placeholder={note.placeholder}
                    maxLength={500}
                  />
                </AdminField>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AdminButton
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelLabel}
              </AdminButton>
              <AdminButton
                variant={confirmVariant[variant]}
                onClick={handleConfirm}
                isLoading={isLoading}
              >
                {confirmLabel}
              </AdminButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
