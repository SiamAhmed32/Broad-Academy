"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
import { cn } from "@/lib/utils";

type InstructorForm = {
  slug: string;
  fullName: string;
  title: string;
  shortBio: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  specialty: string;
  subjects: string;
  expertise: string;
  experienceYears: number;
  featured: boolean;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
};

type FieldErrors = Record<string, string[] | undefined>;

function fieldError(fields: FieldErrors, name: string) {
  return fields[name]?.[0];
}

const emptyForm: InstructorForm = {
  slug: "",
  fullName: "",
  title: "",
  shortBio: "",
  bio: "",
  avatarUrl: "",
  coverUrl: "",
  specialty: "",
  subjects: "",
  expertise: "",
  experienceYears: 0,
  featured: false,
  status: "ACTIVE",
};

function parseList(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toForm(data: Record<string, unknown>): InstructorForm {
  return {
    slug: String(data.slug ?? ""),
    fullName: String(data.fullName ?? ""),
    title: String(data.title ?? ""),
    shortBio: String(data.shortBio ?? ""),
    bio: String(data.bio ?? ""),
    avatarUrl: String(data.avatarUrl ?? ""),
    coverUrl: String(data.coverUrl ?? ""),
    specialty: String(data.specialty ?? ""),
    subjects: Array.isArray(data.subjects) ? data.subjects.join(", ") : "",
    expertise: Array.isArray(data.expertise) ? data.expertise.join(", ") : "",
    experienceYears: Number(data.experienceYears ?? 0),
    featured: Boolean(data.featured),
    status: (data.status as InstructorForm["status"]) ?? "ACTIVE",
  };
}

export default function AdminInstructorFormPage({ slug }: { slug?: string }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const isEdit = Boolean(slug);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageUploads, setImageUploads] = useState({ avatar: false, cover: false });
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [form, setForm] = useState<InstructorForm>(emptyForm);

  useEffect(() => {
    if (!slug) return;
    adminFetch<{ instructor: Record<string, unknown> }>(`/api/instructors/${slug}`).then((res) => {
      if (res.success && res.data?.instructor) {
        setForm(toForm(res.data.instructor));
      } else {
        setError("Instructor not found.");
      }
      setLoading(false);
    });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.avatarUrl) {
      const avatarMessage = "Upload a profile photo before saving.";
      setError(avatarMessage);
      setFields({ avatarUrl: [avatarMessage] });
      return;
    }
    setSaving(true);
    setError("");
    setFields({});

    const normalizedSlug = slugifyInput(form.slug || form.fullName);

    const payload = {
      slug: normalizedSlug,
      fullName: form.fullName,
      title: form.title,
      shortBio: form.shortBio,
      bio: form.bio,
      avatarUrl: form.avatarUrl,
      coverUrl: form.coverUrl || "",
      specialty: form.specialty,
      subjects: parseList(form.subjects),
      expertise: parseList(form.expertise),
      experienceYears: form.experienceYears,
      featured: form.featured,
      status: form.status,
    };

    const res = isEdit
      ? await adminFetch(`/api/instructors/${slug}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/instructors", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (res.success) {
      router.push("/admin/instructors");
    } else {
      const message = res.message ?? "Could not save instructor.";
      setError(message);
      if (res.fields) {
        setFields(res.fields);
      } else if (message.toLowerCase().includes("image")) {
        setFields({ avatarUrl: [message], coverUrl: [message] });
      }
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>("[data-field-invalid='true']")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  if (loading) return <AdminLoading label="Loading instructor..." />;

  return (
    <div>
      <AdminPageHeader
        title={isEdit ? "Edit instructor" : "Add instructor"}
        description="Create a mentor profile for the public instructors page."
        actions={
          <Link
            href="/admin/instructors"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to instructors
          </Link>
        }
      />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AdminCard>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div
              className={fieldError(fields, "fullName") ? "scroll-mt-24" : undefined}
              {...(fieldError(fields, "fullName") ? { "data-field-invalid": "true" } : {})}
            >
              <AdminField label="Full name" error={fieldError(fields, "fullName")}>
                <AdminInput
                  required
                  invalid={Boolean(fieldError(fields, "fullName"))}
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                      slug: isEdit ? form.slug : slugifyInput(e.target.value),
                    })
                  }
                />
              </AdminField>
            </div>
            <div
              className={fieldError(fields, "slug") ? "scroll-mt-24" : undefined}
              {...(fieldError(fields, "slug") ? { "data-field-invalid": "true" } : {})}
            >
              <AdminField
                label="URL slug"
                hint="Used in the profile link"
                error={fieldError(fields, "slug")}
              >
                <AdminInput
                  invalid={Boolean(fieldError(fields, "slug"))}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  onBlur={(e) =>
                    setForm({ ...form, slug: slugifyInput(e.target.value) || form.slug })
                  }
                />
              </AdminField>
            </div>
            <AdminField label="Job title" error={fieldError(fields, "title")}>
              <AdminInput
                required
                invalid={Boolean(fieldError(fields, "title"))}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Senior Mathematics Teacher"
              />
            </AdminField>
            <AdminField label="Specialty" error={fieldError(fields, "specialty")}>
              <AdminInput
                required
                invalid={Boolean(fieldError(fields, "specialty"))}
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="Mathematics"
              />
            </AdminField>
            <AdminField label="Subjects" hint="Comma-separated list" error={fieldError(fields, "subjects")}>
              <AdminInput
                invalid={Boolean(fieldError(fields, "subjects"))}
                value={form.subjects}
                onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                placeholder="Algebra, Geometry"
              />
            </AdminField>
            <AdminField
              label="Areas of expertise"
              hint="Comma-separated list"
              error={fieldError(fields, "expertise")}
            >
              <AdminInput
                invalid={Boolean(fieldError(fields, "expertise"))}
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                placeholder="Exam prep, Problem solving"
              />
            </AdminField>
            <AdminField label="Years of experience" error={fieldError(fields, "experienceYears")}>
              <AdminInput
                type="number"
                min={0}
                invalid={Boolean(fieldError(fields, "experienceYears"))}
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
              />
            </AdminField>
            <AdminField label="Status" error={fieldError(fields, "status")}>
              <AdminSelect
                invalid={Boolean(fieldError(fields, "status"))}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as InstructorForm["status"] })
                }
              >
                <option value="ACTIVE">Active (visible on site)</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
              </AdminSelect>
            </AdminField>
            <div
              className={fieldError(fields, "avatarUrl") ? "scroll-mt-24" : undefined}
              {...(fieldError(fields, "avatarUrl") ? { "data-field-invalid": "true" } : {})}
            >
              <AdminImageUpload
                label="Profile photo"
                value={form.avatarUrl}
                onChange={(avatarUrl) => setForm({ ...form, avatarUrl })}
                onUploadingChange={(avatar) =>
                  setImageUploads((current) => ({ ...current, avatar }))
                }
                purpose="instructor-avatar"
                aspect="square"
                required
                fieldError={fieldError(fields, "avatarUrl")}
                hint="Use a clear portrait. JPG, PNG, or WebP up to 5 MB."
              />
            </div>
            <AdminImageUpload
              label="Cover photo"
              value={form.coverUrl}
              onChange={(coverUrl) => setForm({ ...form, coverUrl })}
              onUploadingChange={(cover) =>
                setImageUploads((current) => ({ ...current, cover }))
              }
              purpose="instructor-cover"
              aspect="cover"
              fieldError={fieldError(fields, "coverUrl")}
              hint="Optional wide banner. JPG, PNG, or WebP up to 5 MB."
            />
            <div
              className={cn("sm:col-span-2", fieldError(fields, "shortBio") && "scroll-mt-24")}
              {...(fieldError(fields, "shortBio") ? { "data-field-invalid": "true" } : {})}
            >
              <AdminField
                label="Short bio"
                hint="Shown on instructor cards (10–220 characters)"
                error={fieldError(fields, "shortBio")}
              >
                <AdminTextarea
                  required
                  invalid={Boolean(fieldError(fields, "shortBio"))}
                  value={form.shortBio}
                  onChange={(e) => setForm({ ...form, shortBio: e.target.value })}
                  className="min-h-[80px]"
                />
              </AdminField>
            </div>
            <div
              className={cn("sm:col-span-2", fieldError(fields, "bio") && "scroll-mt-24")}
              {...(fieldError(fields, "bio") ? { "data-field-invalid": "true" } : {})}
            >
              <AdminField
                label="Full bio"
                hint="At least 30 characters"
                error={fieldError(fields, "bio")}
              >
                <AdminTextarea
                  required
                  invalid={Boolean(fieldError(fields, "bio"))}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </AdminField>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="featured"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-accent"
              />
              <label htmlFor="featured" className="text-sm text-navy">
                Show as featured instructor
              </label>
            </div>
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
                {error}
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <AdminButton
                type="submit"
                isLoading={saving}
                disabled={imageUploads.avatar || imageUploads.cover || !form.avatarUrl}
              >
                {isEdit ? "Save changes" : "Create instructor"}
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      </motion.div>
    </div>
  );
}
