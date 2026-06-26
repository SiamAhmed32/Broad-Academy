"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminImageUpload,
  AdminLoading,
  AdminPageHeader,
  AdminSelect,
  AdminTextarea,
} from "@/components/Admin";
import { adminFetch, slugifyInput } from "@/lib/admin/client";
import { courseLevelLabels } from "@/lib/courses/constants";
import type { CourseLevel } from "@/generated/prisma/client";

type CourseForm = {
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  level: CourseLevel;
  subject: string;
  instructorName: string;
  thumbnailUrl: string;
  price: number;
  originalPrice: number | null;
  durationMinutes: number;
  lessonCount: number;
  featured: boolean;
  homepageOrder: number;
  badge: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export default function AdminCourseEditPage({ courseId }: { courseId: string }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<CourseForm | null>(null);

  useEffect(() => {
    async function load() {
      const res = await adminFetch<CourseForm>(`/api/admin/courses/${courseId}`);
      if (res.success && res.data) {
        setForm(res.data as CourseForm);
      } else {
        setError(res.message ?? "Course not found.");
      }
      setLoading(false);
    }
    load();
  }, [courseId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.thumbnailUrl) {
      setError("Upload a course thumbnail before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const { lessonCount: _lessonCount, durationMinutes: _durationMinutes, ...payload } = form;
      const res = await adminFetch<CourseForm>(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        setError(res.message ?? "Could not save changes.");
        setFieldErrors(res.fields ?? {});
        return;
      }

      router.replace("/admin/courses");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this course permanently? This cannot be undone.")) return;
    setDeleting(true);
    const res = await adminFetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.success) router.push("/admin/courses");
    else setError(res.message ?? "Could not delete course.");
  }

  if (loading) return <AdminLoading label="Loading course..." />;
  if (!form) {
    return (
      <div>
        <AdminPageHeader title="Course not found" />
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/admin/courses" className="mt-4 inline-block text-accent hover:underline">
          ← Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Edit course"
        description={form.title}
        actions={
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>
        }
      />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AdminCard>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Course title" error={fieldErrors.title?.[0]}>
              <AdminInput
                required
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value, slug: slugifyInput(e.target.value) })
                }
              />
            </AdminField>
            <AdminField
              label="URL slug"
              hint="Used in the course link"
              error={fieldErrors.slug?.[0]}
            >
              <AdminInput
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </AdminField>
            <AdminField label="Subject" error={fieldErrors.subject?.[0]}>
              <AdminInput
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </AdminField>
            <AdminField label="Category" error={fieldErrors.category?.[0]}>
              <AdminInput
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </AdminField>
            <AdminField label="Class level" error={fieldErrors.level?.[0]}>
              <AdminSelect
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as CourseLevel })}
              >
                {Object.entries(courseLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField
              label="Instructor name"
              error={fieldErrors.instructorName?.[0]}
            >
              <AdminInput
                required
                value={form.instructorName}
                onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
              />
            </AdminField>
            <AdminField label="Price (BDT)" error={fieldErrors.price?.[0]}>
              <AdminInput
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </AdminField>
            <AdminField
              label="Original price (optional)"
              error={fieldErrors.originalPrice?.[0]}
            >
              <AdminInput
                type="number"
                min={0}
                value={form.originalPrice ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    originalPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </AdminField>
            <AdminField
              label="Total duration"
              hint="Auto-calculated from lesson video lengths in Admin → Content."
            >
              <AdminInput
                type="text"
                readOnly
                disabled
                value={
                  form.lessonCount > 0
                    ? `${form.durationMinutes} min (${form.lessonCount} lessons)`
                    : "Add lessons in Content to calculate"
                }
              />
            </AdminField>
            <AdminField
              label="Lesson count"
              hint="Auto-calculated when you add chapters and lessons."
            >
              <AdminInput type="number" readOnly disabled value={form.lessonCount} />
            </AdminField>
            <div className="sm:col-span-2">
              <AdminImageUpload
                label="Course thumbnail"
                value={form.thumbnailUrl}
                onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })}
                onUploadingChange={setImageUploading}
                purpose="course-thumbnail"
                aspect="video"
                required
                fieldError={fieldErrors.thumbnailUrl?.[0]}
              />
            </div>
            <AdminField
              label="Badge (optional)"
              hint='e.g. "Popular" or "New"'
              error={fieldErrors.badge?.[0]}
            >
              <AdminInput
                value={form.badge ?? ""}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
              />
            </AdminField>
            <AdminField label="Status" error={fieldErrors.status?.[0]}>
              <AdminSelect
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as CourseForm["status"] })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </AdminSelect>
            </AdminField>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-accent"
                />
                <label htmlFor="featured" className="text-sm text-navy">
                  Show on homepage as featured
                </label>
              </div>
              {form.featured ? (
                <AdminField
                  label="Homepage priority"
                  hint="Lower numbers appear first on the homepage (0 = top)."
                  error={fieldErrors.homepageOrder?.[0]}
                >
                  <AdminInput
                    type="number"
                    min={0}
                    max={9999}
                    value={form.homepageOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        homepageOrder: Number(e.target.value) || 0,
                      })
                    }
                  />
                </AdminField>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <AdminField
                label="Short description"
                error={fieldErrors.shortDescription?.[0]}
              >
                <AdminTextarea
                  required
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />
              </AdminField>
            </div>
            {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <AdminButton
                type="submit"
                isLoading={saving}
                disabled={imageUploading || !form.thumbnailUrl}
              >
                Save changes
              </AdminButton>
              <AdminButton type="button" variant="danger" isLoading={deleting} onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete course
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      </motion.div>
    </div>
  );
}
