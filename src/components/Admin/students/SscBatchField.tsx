"use client";

import { CalendarDays, Check, Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";

import { useAdminToast } from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";

/** Shows a student's SSC batch and lets staff with student access correct it. */
export default function SscBatchField({
  studentId,
  value,
  canEdit,
  onSaved,
}: {
  studentId: string;
  value: number | null;
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const { showToast } = useAdminToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ? String(value) : "");
  const [saving, setSaving] = useState(false);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 14 }, (_, index) => thisYear - 3 + index);
  if (value && !years.includes(value)) years.unshift(value);

  async function save() {
    setSaving(true);
    const response = await adminFetch<{ sscBatch: number | null }>(
      `/api/admin/students/${studentId}/batch`,
      { method: "PATCH", body: JSON.stringify({ sscBatch: draft ? Number(draft) : null }) },
    );
    setSaving(false);
    if (!response.success) {
      showToast(response.message ?? "Could not update the SSC batch.", true);
      return;
    }
    showToast(response.message ?? "SSC batch updated.");
    setEditing(false);
    await onSaved();
  }

  return (
    <div className="flex items-start gap-2">
      <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] uppercase tracking-wide text-slate-400">SSC batch</dt>
        {editing ? (
          <dd className="mt-1 flex items-center gap-1.5">
            <select
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-navy outline-none focus:border-accent"
              aria-label="SSC batch year"
              autoFocus
            >
              <option value="">Not set</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  SSC {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
              aria-label="Save SSC batch"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(value ? String(value) : "");
                setEditing(false);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </dd>
        ) : (
          <dd className="flex items-center gap-1.5 text-sm text-slate-700">
            {value ? `SSC ${value}` : "Not set"}
            {canEdit ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded p-0.5 text-slate-400 hover:text-accent"
                aria-label="Edit SSC batch"
                title="Edit SSC batch"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </dd>
        )}
      </div>
    </div>
  );
}
