"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";

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
  useAdminToast,
} from "@/components/Admin";
import { useAdminCan } from "@/components/Admin/AdminPermissionsContext";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { CourseIncludesEditor } from "@/components/Admin/content/CourseIncludesEditor";
import { adminFetch, slugifyInput } from "@/lib/admin/client";
import {
  COURSE_DESCRIPTION_MAX_LENGTH,
  courseLevelLabels,
} from "@/lib/courses/constants";
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
  examCount: number;
  featured: boolean;
  homepageOrder: number;
  badge: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  description: string;
  includes: string[];
  facebookGroupUrl: string;
};

type CourseResponse = Omit<CourseForm, "description" | "includes" | "facebookGroupUrl"> & {
  description: string | null;
  includes: string[] | null;
  facebookGroupUrl: string | null;
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
  const { showToast } = useAdminToast();
  const canManage = useAdminCan(ADMIN_PERMISSIONS.COURSES);

  useEffect(() => {
    async function load() {
      const res = await adminFetch<CourseResponse>(`/api/admin/courses/${courseId}`);
      if (res.success && res.data) {
        setForm({
          ...res.data,
          description: res.data.description ?? "",
          includes: res.data.includes ?? [],
          facebookGroupUrl: res.data.facebookGroupUrl ?? "",
        });
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
        body: JSON.stringify({
          ...payload,
          description: form.description.trim() || null,
          includes: form.includes.map((line) => line.trim()).filter(Boolean),
          facebookGroupUrl: form.facebookGroupUrl.trim() || null,
        }),
      });

      if (!res.success) {
        showToast(res.message ?? "Could not save changes.", true);
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
    else showToast(res.message ?? "Could not delete course.", true);
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
          <div className="flex flex-wrap items-center gap-4">
            {form.status === "PUBLISHED" ? (
              <Link
                href={`/courses/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-navy"
              >
                View course page
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
          </div>
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
              label="Exam count"
              hint="Shown on course cards. Updates automatically when exams are linked."
              error={fieldErrors.examCount?.[0]}
            >
              <AdminInput
                type="number"
                min={0}
                value={form.examCount ?? 0}
                onChange={(e) =>
                  setForm({ ...form, examCount: Number(e.target.value) || 0 })
                }
              />
            </AdminField>
            <AdminField
              label="Instructor name"
              hint="Separate several teachers with commas. Names matching an instructor profile show their photo on the course page."
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

            <div className="border-t border-slate-100 pt-5 sm:col-span-2">
              <h2 className="text-base font-semibold text-navy">Course page content</h2>
              <p className="mt-1 text-sm text-slate-500">
                What visitors see on the public course details page.
              </p>
            </div>
            <div className="sm:col-span-2">
              <AdminField
                label="Course details (about)"
                hint={`Shown under “কোর্স ডিটেইলস → কোর্স সম্পর্কে”. Line breaks are kept. ${form.description.length.toLocaleString("en-US")}/${COURSE_DESCRIPTION_MAX_LENGTH.toLocaleString("en-US")} characters.`}
                error={fieldErrors.description?.[0]}
              >
                <AdminTextarea
                  rows={10}
                  maxLength={COURSE_DESCRIPTION_MAX_LENGTH}
                  value={form.description}
                  placeholder="কোর্সটি কাদের জন্য, কী কী শেখানো হবে, ক্লাস কীভাবে হবে…"
                  className="font-bangla min-h-[220px] leading-7"
                  invalid={Boolean(fieldErrors.description)}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </AdminField>
            </div>
            <div className="sm:col-span-2">
              <CourseIncludesEditor
                value={form.includes}
                onChange={(includes) => setForm({ ...form, includes })}
                error={fieldErrors.includes?.[0]}
              />
            </div>
            <div className="sm:col-span-2">
              <AdminField
                label="Private Facebook group link (optional)"
                hint="Only enrolled students see this link, together with their unique access code. It is never shown on the public course page."
                error={fieldErrors.facebookGroupUrl?.[0]}
              >
                <AdminInput
                  type="url"
                  inputMode="url"
                  value={form.facebookGroupUrl}
                  placeholder="https://www.facebook.com/groups/…"
                  invalid={Boolean(fieldErrors.facebookGroupUrl)}
                  onChange={(e) => setForm({ ...form, facebookGroupUrl: e.target.value })}
                />
              </AdminField>
            </div>

            {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
            {canManage ? (
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
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:col-span-2">
                View only — you can see this course but not change it.
              </p>
            )}
          </form>
        </AdminCard>
      </motion.div>
    </div>
  );
}
