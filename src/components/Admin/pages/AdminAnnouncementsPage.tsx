"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, CheckCircle2, XCircle, Eye } from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminSelect,
} from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import { useAdminToast } from "@/components/Admin/ui/AdminToast";

type Announcement = {
  id: string;
  text: string;
  badge: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  isActive: boolean;
  bgGradient: string;
  textColor: string;
  createdAt: string;
};

type AnnouncementForm = {
  text: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  bgGradient: string;
  textColor: string;
};

const emptyForm: AnnouncementForm = {
  text: "",
  badge: "",
  ctaText: "",
  ctaLink: "",
  isActive: false,
  bgGradient: "from-violet-600 to-indigo-600",
  textColor: "text-white",
};

const GRADIENT_PRESETS = [
  { name: "Royal Violet (Indigo/Violet)", value: "from-violet-600 to-indigo-600" },
  { name: "Sunset Glow (Amber/Rose/Violet)", value: "from-amber-500 via-rose-500 to-violet-600" },
  { name: "Ocean Breeze (Cyan/Blue)", value: "from-cyan-500 to-blue-600" },
  { name: "Emerald Luxury (Emerald/Teal)", value: "from-emerald-500 to-teal-600" },
  { name: "Mystic Dark (Slate/Purple)", value: "from-slate-900 via-purple-900 to-slate-900" },
  { name: "Neon Aurora (Fuchsia/Indigo)", value: "from-fuchsia-600 to-indigo-600" },
];

export default function AdminAnnouncementsPage() {
  const shouldReduceMotion = useReducedMotion();
  const { showToast, ToastViewport } = useAdminToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{ announcements: Announcement[] }>("/api/admin/announcements?limit=50");
    if (res.success && res.data) {
      setAnnouncements(res.data.announcements);
    } else {
      showToast("Failed to load announcements", true);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  function startEdit(announcement: Announcement) {
    setEditingId(announcement.id);
    setForm({
      text: announcement.text,
      badge: announcement.badge || "",
      ctaText: announcement.ctaText || "",
      ctaLink: announcement.ctaLink || "",
      isActive: announcement.isActive,
      bgGradient: announcement.bgGradient,
      textColor: announcement.textColor,
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    // Clean up empty fields to null
    const payload = {
      ...form,
      badge: form.badge.trim() || null,
      ctaText: form.ctaText.trim() || null,
      ctaLink: form.ctaLink.trim() || null,
    };

    const res = editingId
      ? await adminFetch(`/api/admin/announcements/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/admin/announcements", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (res.success) {
      showToast(editingId ? "Announcement updated successfully" : "Announcement created successfully");
      resetForm();
      loadAnnouncements();
    } else {
      showToast(res.message || "Failed to save announcement", true);
    }
  }

  async function toggleActive(announcement: Announcement) {
    const newActiveState = !announcement.isActive;
    const res = await adminFetch(`/api/admin/announcements/${announcement.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: newActiveState }),
    });

    if (res.success) {
      showToast(newActiveState ? "Announcement activated" : "Announcement deactivated");
      loadAnnouncements();
    } else {
      showToast(res.message || "Failed to toggle status", true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement permanently?")) return;
    const res = await adminFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.success) {
      showToast("Announcement deleted permanently");
      loadAnnouncements();
    } else {
      showToast(res.message || "Failed to delete announcement", true);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Configure dynamic, high-converting banner messages displayed at the very top of the website."
        actions={
          <AdminButton
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Announcement
          </AdminButton>
        }
      />

      {showForm ? (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminCard className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-navy">
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AdminField label="Banner Announcement Message">
                <AdminInput
                  required
                  placeholder="e.g., 🔥 New Batch Starts July 15 | 500+ Students Already Enrolled!"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
              </AdminField>

              <div className="grid gap-4 sm:grid-cols-3">
                <AdminField label="Badge Text (Optional)">
                  <AdminInput
                    placeholder="e.g., NEW, OFFER, HOT"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  />
                </AdminField>
                <AdminField label="CTA Button Text (Optional)">
                  <AdminInput
                    placeholder="e.g., Reserve Seat, Enroll Now"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  />
                </AdminField>
                <AdminField label="CTA Button Link (Optional)">
                  <AdminInput
                    placeholder="e.g., /courses, https://..."
                    value={form.ctaLink}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  />
                </AdminField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Background Style Preset">
                  <AdminSelect
                    value={form.bgGradient}
                    onChange={(e) => setForm({ ...form, bgGradient: e.target.value })}
                  >
                    {GRADIENT_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>

                <AdminField label="Text Color">
                  <AdminSelect
                    value={form.textColor}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                  >
                    <option value="text-white">White Text (Recommended)</option>
                    <option value="text-slate-100">Light Gray Text</option>
                    <option value="text-yellow-200">Soft Yellow Text</option>
                  </AdminSelect>
                </AdminField>
              </div>

              {/* Preview Banner */}
              {form.text && (
                <div className="pt-2">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Visual Live Preview:</p>
                  <div className={`w-full bg-gradient-to-r ${form.bgGradient} ${form.textColor} py-2.5 px-4 rounded-xl text-center text-xs md:text-sm font-medium flex items-center justify-center gap-3 shadow-md border border-white/10`}>
                    {form.badge && (
                      <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {form.badge}
                      </span>
                    )}
                    <span>{form.text}</span>
                    {form.ctaText && (
                      <span className="bg-white text-navy px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow-sm cursor-pointer whitespace-nowrap">
                        {form.ctaText}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-navy">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  Activate Announcement immediately (will deactivate any other active banner)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <AdminButton type="submit" isLoading={saving}>
                  {editingId ? "Save changes" : "Create Announcement"}
                </AdminButton>
                <AdminButton type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </AdminButton>
              </div>
            </form>
          </AdminCard>
        </motion.div>
      ) : null}

      {loading ? (
        <AdminLoading label="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <AdminEmpty
          title="No announcements yet"
          description="Create your first top bar announcement campaign."
          actionLabel="Add Announcement"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-semibold text-navy">Preview</th>
                  <th className="px-5 py-3 font-semibold text-navy">CTA Details</th>
                  <th className="px-5 py-3 font-semibold text-navy">Status</th>
                  <th className="px-5 py-3 font-semibold text-navy">Created</th>
                  <th className="px-5 py-3 font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann, index) => (
                  <motion.tr
                    key={ann.id}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4 max-w-xs md:max-w-md">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${ann.bgGradient} ${ann.textColor} text-[11px] font-medium flex items-center gap-2 truncate shadow-sm`}>
                        {ann.badge && (
                          <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[9px] uppercase font-bold">
                            {ann.badge}
                          </span>
                        )}
                        <span className="truncate">{ann.text}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {ann.ctaText ? (
                        <div>
                          <span className="font-semibold text-navy text-xs">{ann.ctaText}</span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]" title={ann.ctaLink || ""}>
                            {ann.ctaLink}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No CTA button</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(ann)}
                        className="inline-flex focus:outline-none"
                      >
                        {ann.isActive ? (
                          <AdminBadge variant="success">Active</AdminBadge>
                        ) : (
                          <AdminBadge variant="muted">Inactive</AdminBadge>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{formatAdminDate(ann.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(ann)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ann.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
      {ToastViewport}
    </div>
  );
}
