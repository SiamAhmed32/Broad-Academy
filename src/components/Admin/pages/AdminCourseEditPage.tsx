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
import { CourseInstructorPicker } from "@/components/Admin/content/CourseInstructorPicker";
import { adminFetch } from "@/lib/admin/client";
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
  detailsHeading: string;
  aboutHeading: string;
  includesHeading: string;
  includes: string[];
  enrollmentGuideYoutubeUrl: string;
  facebookGroupUrl: string;
};
type CourseResponse = Omit<
  CourseForm,
  "description" | "includes" | "enrollmentGuideYoutubeUrl" | "facebookGroupUrl"
> & {
  description: string | null;
  detailsHeading: string | null;
  aboutHeading: string | null;
  includesHeading: string | null;
  includes: string[] | null;
  enrollmentGuideYoutubeUrl: string | null;
  facebookGroupUrl: string | null;
};
export default function AdminCourseEditPage({
  courseId,
}: {
  courseId: string;
}) {
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
      const res = await adminFetch<CourseResponse>(
        `/api/admin/courses/${courseId}`,
      );
      if (res.success && res.data) {
        setForm({
          ...res.data,
          description: res.data.description ?? "",
          detailsHeading: res.data.detailsHeading ?? "কোর্স ডিটেইলস",
          aboutHeading: res.data.aboutHeading ?? "কোর্স সম্পর্কে:",
          includesHeading: res.data.includesHeading ?? "এই কোর্সে যা থাকছে",
          includes: res.data.includes ?? [],
          enrollmentGuideYoutubeUrl: res.data.enrollmentGuideYoutubeUrl ?? "",
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
    if (!form.instructorName.trim()) {
      setFieldErrors({ instructorName: ["Select at least one teacher."] });
      return;
    }
    if (!form.thumbnailUrl) {
      setError("Upload a course thumbnail before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const {
        lessonCount: _lessonCount,
        durationMinutes: _durationMinutes,
        ...payload
      } = form;
      void _lessonCount;
      void _durationMinutes;
      const res = await adminFetch<CourseForm>(
        `/api/admin/courses/${courseId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...payload,
            description: form.description.trim() || null,
            includes: form.includes.map((line) => line.trim()).filter(Boolean),
            enrollmentGuideYoutubeUrl: form.enrollmentGuideYoutubeUrl.trim() || null,
            facebookGroupUrl: form.facebookGroupUrl.trim() || null,
          }),
        },
      );
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
    if (!confirm("Delete this course permanently? This cannot be undone."))
      return;
    setDeleting(true);
    const res = await adminFetch(`/api/admin/courses/${courseId}`, {
      method: "DELETE",
    });
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
        <Link
          href="/admin/courses"
          className="mt-4 inline-block text-accent hover:underline"
        >
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
          <nav
            aria-label="Course editor sections"
            className="mb-6 flex flex-wrap gap-2"
          >
            <a
              href="#course-basics"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent"
            >
              Basics
            </a>
            <a
              href="#course-page"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent"
            >
              Course page
            </a>
            <a
              href="#course-publishing"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent"
            >
              Pricing & publishing
            </a>
            <a
              href="#course-access"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent"
            >
              Student access
            </a>
          </nav>
          <form onSubmit={handleSave} className="space-y-6">
            <fieldset
              id="course-basics"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
            >
              <legend className="px-2 text-lg font-semibold text-navy">
                Course basics
              </legend>
              <p className="mb-6 text-sm leading-6 text-slate-500">
                Identify the course and its teachers.
              </p>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {" "}
                <AdminField label="Course title" error={fieldErrors.title?.[0]}>
                  <AdminInput
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </AdminField>
                <AdminField
                  label="URL slug"
                  hint="Used in the course link. Changing the title keeps this link unchanged."
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
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Category" error={fieldErrors.category?.[0]}>
                  <AdminInput
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Class level" error={fieldErrors.level?.[0]}>
                  <AdminSelect
                    value={form.level}
                    onChange={(e) =>
                      setForm({ ...form, level: e.target.value as CourseLevel })
                    }
                  >
                    {Object.entries(courseLevelLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <CourseInstructorPicker
                  value={form.instructorName}
                  onChange={(instructorName) => {
                    setForm({ ...form, instructorName });
                    setFieldErrors((errors) => ({ ...errors, instructorName: [] }));
                  }}
                  error={fieldErrors.instructorName?.[0]}
                />
              </div>
            </fieldset>
            <fieldset
              id="course-page"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
            >
              <legend className="px-2 text-lg font-semibold text-navy">
                Course page content
              </legend>
              <p className="mb-6 text-sm leading-6 text-slate-500">
                Write the information visitors see. Update it as the course
                develops without relying on uploaded lesson counts.
              </p>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {" "}
                <div className="sm:col-span-2">
                  <AdminField
                    label="Short description"
                    error={fieldErrors.shortDescription?.[0]}
                  >
                    <AdminTextarea
                      required
                      value={form.shortDescription}
                      onChange={(e) =>
                        setForm({ ...form, shortDescription: e.target.value })
                      }
                    />
                  </AdminField>
                </div>
                <div className="sm:col-span-2">
                  <AdminImageUpload
                    label="Course thumbnail"
                    value={form.thumbnailUrl}
                    onChange={(thumbnailUrl) =>
                      setForm({ ...form, thumbnailUrl })
                    }
                    onUploadingChange={setImageUploading}
                    purpose="course-thumbnail"
                    aspect="video"
                    required
                    fieldError={fieldErrors.thumbnailUrl?.[0]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <AdminField label="Details section heading" error={fieldErrors.detailsHeading?.[0]}>
                      <AdminInput value={form.detailsHeading} onChange={(e) => setForm({ ...form, detailsHeading: e.target.value })} />
                    </AdminField>
                    <AdminField label="About heading" error={fieldErrors.aboutHeading?.[0]}>
                      <AdminInput value={form.aboutHeading} onChange={(e) => setForm({ ...form, aboutHeading: e.target.value })} />
                    </AdminField>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <AdminField
                    label="Course details (about)"
                    hint={`Shown under the headings above. Line breaks are kept. ${form.description.length.toLocaleString("en-US")}/${COURSE_DESCRIPTION_MAX_LENGTH.toLocaleString("en-US")} characters.`}
                    error={fieldErrors.description?.[0]}
                  >
                    <AdminTextarea
                      rows={10}
                      maxLength={COURSE_DESCRIPTION_MAX_LENGTH}
                      value={form.description}
                      placeholder="কোর্সটি কাদের জন্য, কী কী শেখানো হবে, ক্লাস কীভাবে হবে…"
                      className="font-bangla min-h-[220px] leading-7"
                      invalid={Boolean(fieldErrors.description)}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </AdminField>
                </div>
                <div className="sm:col-span-2">
                  <AdminField label="Includes heading" error={fieldErrors.includesHeading?.[0]}>
                    <AdminInput value={form.includesHeading} onChange={(e) => setForm({ ...form, includesHeading: e.target.value })} />
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
                    label="Enrollment guide YouTube link (optional)"
                    hint="Paste the video explaining how to buy this course. It appears in the purchase card on this course page."
                    error={fieldErrors.enrollmentGuideYoutubeUrl?.[0]}
                  >
                    <AdminInput
                      type="url"
                      inputMode="url"
                      value={form.enrollmentGuideYoutubeUrl}
                      placeholder="https://www.youtube.com/watch?v=..."
                      invalid={Boolean(fieldErrors.enrollmentGuideYoutubeUrl)}
                      onChange={(e) => setForm({ ...form, enrollmentGuideYoutubeUrl: e.target.value })}
                    />
                  </AdminField>
                </div>
              </div>
            </fieldset>
            <fieldset
              id="course-publishing"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
            >
              <legend className="px-2 text-lg font-semibold text-navy">
                Pricing & publishing
              </legend>
              <p className="mb-6 text-sm leading-6 text-slate-500">
                Set the price, availability and homepage placement.
              </p>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {" "}
                <AdminField label="Price (BDT)" error={fieldErrors.price?.[0]}>
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
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
                        originalPrice: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </AdminField>
                <AdminField
                  label="Badge (optional)"
                  hint='e.g. "Popular" or "New"'
                  error={fieldErrors.badge?.[0]}
                >
                  <AdminInput
                    value={form.badge ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, badge: e.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Status" error={fieldErrors.status?.[0]}>
                  <AdminSelect
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as CourseForm["status"],
                      })
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
                      onChange={(e) =>
                        setForm({ ...form, featured: e.target.checked })
                      }
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
              </div>
            </fieldset>
            <fieldset
              id="course-access"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
            >
              <legend className="px-2 text-lg font-semibold text-navy">
                Student access
              </legend>
              <p className="mb-6 text-sm leading-6 text-slate-500">
                Private group access is available only to enrolled students.
              </p>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {" "}
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
                      onChange={(e) =>
                        setForm({ ...form, facebookGroupUrl: e.target.value })
                      }
                    />
                  </AdminField>
                </div>
              </div>
            </fieldset>
            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-semibold text-navy">
                Internal content totals
              </summary>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {" "}
                <AdminField
                  label="Exam count"
                  hint="Internal total. Not shown on course cards or the course feature list."
                  error={fieldErrors.examCount?.[0]}
                >
                  <AdminInput
                    type="number"
                    min={0}
                    value={form.examCount ?? 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        examCount: Number(e.target.value) || 0,
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
                  <AdminInput
                    type="number"
                    readOnly
                    disabled
                    value={form.lessonCount}
                  />
                </AdminField>
              </div>
            </details>{" "}
            {Object.keys(fieldErrors).length ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <p className="font-semibold">
                  Please correct these fields before saving:
                </p>
                <ul className="mt-2 list-inside list-disc">
                  {Object.entries(fieldErrors).flatMap(([field, messages]) =>
                    messages.map((message) => (
                      <li key={field + message}>
                        {field}: {message}
                      </li>
                    )),
                  )}
                </ul>
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
            {canManage ? (
              <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <AdminButton
                  type="submit"
                  isLoading={saving}
                  disabled={imageUploading || !form.thumbnailUrl}
                >
                  Save changes
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="danger"
                  isLoading={deleting}
                  onClick={handleDelete}
                >
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
