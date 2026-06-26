"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

import { AdminButton } from "./AdminButton";

type AdminEmptyProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AdminEmpty({
  title,
  description,
  actionLabel,
  onAction,
}: AdminEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-navy shadow-sm">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <AdminButton className="mt-6" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      ) : null}
    </motion.div>
  );
}

export function AdminLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-slate-500">
      {label}
    </div>
  );
}
