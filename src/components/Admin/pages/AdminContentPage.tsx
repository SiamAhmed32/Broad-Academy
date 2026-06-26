"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, Link2, Plus, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminSelect,
  AdminTextarea,
} from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";
import Modal from "@/components/reusables/Modal";

type CourseOption = { id: string; title: string; slug: string; status: string };
type LessonResource = { id: string; title: string; url: string; displayOrder: number };
type Lesson = {
  id: string;
  title: string;
  type: "VIDEO" | "READING" | "QUIZ";
  description: string;
  youtubeVideoId?: string | null;
  durationSeconds: number;
  isPreview: boolean;
  resources?: LessonResource[];
};
type Module = {
  id: string;
  title: string;
  displayOrder: number;
  lessons: Lesson[];
};
type ContentResponse = {
  courses: CourseOption[];
  course: { modules: Module[] } | null;
  selectedCourseId: string | null;
};

export default function AdminContentPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const contentCacheRef = useRef(new Map<string, Module[]>());
  const lastLoadedCourseIdRef = useRef("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonType, setLessonType] = useState<"VIDEO" | "READING" | "QUIZ">("VIDEO");
  const [youtubeId, setYoutubeId] = useState("");
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState("");

  // Edit module & lesson state variables
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonDescription, setEditLessonDescription] = useState("");
  const [editLessonType, setEditLessonType] = useState<"VIDEO" | "READING" | "QUIZ">("VIDEO");
  const [editLessonYoutubeId, setEditLessonYoutubeId] = useState("");
  const [editLessonDurationMinutes, setEditLessonDurationMinutes] = useState("");

  const [managingResourcesLesson, setManagingResourcesLesson] = useState<Lesson | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceError, setResourceError] = useState("");

  const loadContent = useCallback(async (id: string, force = false) => {
    if (!id) return;
    if (!force && contentCacheRef.current.has(id)) {
      setModules(contentCacheRef.current.get(id) ?? []);
      lastLoadedCourseIdRef.current = id;
      return;
    }

    setContentLoading(true);
    const res = await adminFetch<ContentResponse>(
      `/api/admin/content?courseId=${id}`,
    );
    if (res.success && res.data) {
      const nextModules = res.data.course?.modules ?? [];
      if (res.data.courses.length) setCourses(res.data.courses);
      contentCacheRef.current.set(id, nextModules);
      lastLoadedCourseIdRef.current = id;
      setModules(nextModules);
    }
    setContentLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminFetch<ContentResponse>("/api/admin/content", {
      signal: controller.signal,
    }).then((res) => {
      if (res.success && res.data) {
        setCourses(res.data.courses);
        const selectedId = res.data.selectedCourseId ?? "";
        const nextModules = res.data.course?.modules ?? [];
        if (selectedId) {
          contentCacheRef.current.set(selectedId, nextModules);
          lastLoadedCourseIdRef.current = selectedId;
          setCourseId(selectedId);
          setModules(nextModules);
        }
      }
      setLoading(false);
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (courseId && lastLoadedCourseIdRef.current !== courseId) {
      void Promise.resolve().then(() => loadContent(courseId));
    }
  }, [courseId, loadContent]);

  async function refreshCurrentContent() {
    if (!courseId) return;
    contentCacheRef.current.delete(courseId);
    await loadContent(courseId, true);
  }

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim() || !courseId) return;
    setSaving(true);
    const res = await adminFetch("/api/admin/modules", {
      method: "POST",
      body: JSON.stringify({ courseId, title: moduleTitle.trim() }),
    });
    setSaving(false);
    if (res.success) {
      setModuleTitle("");
      void refreshCurrentContent();
    }
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonModuleId || !lessonTitle.trim()) return;
    setSaving(true);
    setError("");
    const res = await adminFetch<{ id: string }>("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify({
        moduleId: lessonModuleId,
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || "Lesson content",
        type: lessonType,
        youtubeVideoId: lessonType === "VIDEO" ? youtubeId || null : null,
        durationSeconds: lessonDurationMinutes
          ? Math.max(0, Math.round(Number(lessonDurationMinutes) * 60))
          : 0,
      }),
    });
    setSaving(false);
    if (res.success && res.data?.id) {
      const createdLessonId = res.data.id;
      setLessonTitle("");
      setLessonDescription("");
      setYoutubeId("");
      setLessonDurationMinutes("");
      await refreshCurrentContent();

      if (lessonType === "QUIZ") {
        router.push(
          `/admin/quizzes?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(createdLessonId)}`,
        );
        return;
      }
    } else {
      setError(res.message ?? "Could not add lesson. Check the fields and try again.");
    }
  }

  async function deleteModule(id: string) {
    if (!confirm("Delete this section and all its lessons?")) return;
    await adminFetch(`/api/admin/modules?id=${id}`, { method: "DELETE" });
    void refreshCurrentContent();
  }

  async function deleteLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    await adminFetch(`/api/admin/lessons?id=${id}`, { method: "DELETE" });
    void refreshCurrentContent();
  }

  function startEditModule(mod: Module) {
    setEditingModule(mod);
    setEditModuleTitle(mod.title);
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLesson(lesson);
    setEditLessonTitle(lesson.title);
    setEditLessonDescription(lesson.description || "");
    setEditLessonType(lesson.type);
    setEditLessonYoutubeId(lesson.youtubeVideoId || "");
    setEditLessonDurationMinutes(
      lesson.durationSeconds > 0
        ? String(Math.max(1, Math.round(lesson.durationSeconds / 60)))
        : "",
    );
  }

  async function saveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingModule || !editModuleTitle.trim()) return;
    setSaving(true);
    const res = await adminFetch("/api/admin/modules", {
      method: "PATCH",
      body: JSON.stringify({ id: editingModule.id, title: editModuleTitle.trim() }),
    });
    setSaving(false);
    if (res.success) {
      setEditingModule(null);
      void refreshCurrentContent();
    } else {
      alert(res.message || "Failed to update section");
    }
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLesson || !editLessonTitle.trim()) return;
    setSaving(true);
    const res = await adminFetch("/api/admin/lessons", {
      method: "PATCH",
      body: JSON.stringify({
        id: editingLesson.id,
        title: editLessonTitle.trim(),
        description: editLessonDescription.trim() || "Lesson content",
        type: editLessonType,
        youtubeVideoId: editLessonType === "VIDEO" ? editLessonYoutubeId || null : null,
        durationSeconds: editLessonDurationMinutes
          ? Math.max(0, Math.round(Number(editLessonDurationMinutes) * 60))
          : 0,
      }),
    });
    setSaving(false);
    if (res.success) {
      setEditingLesson(null);
      void refreshCurrentContent();
    } else {
      alert(res.message || "Failed to update lesson");
    }
  }

  function startManageResources(lesson: Lesson) {
    setManagingResourcesLesson(lesson);
    setResourceTitle("");
    setResourceUrl("");
    setResourceError("");
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!managingResourcesLesson) return;
    setSaving(true);
    setResourceError("");
    const res = await adminFetch<LessonResource>("/api/admin/lesson-resources", {
      method: "POST",
      body: JSON.stringify({
        lessonId: managingResourcesLesson.id,
        title: resourceTitle.trim(),
        url: resourceUrl.trim(),
      }),
    });
    setSaving(false);
    if (res.success) {
      setResourceTitle("");
      setResourceUrl("");
      await refreshCurrentContent();
      setManagingResourcesLesson((current) => {
        if (!current || !res.data) return current;
        return {
          ...current,
          resources: [...(current.resources ?? []), res.data!],
        };
      });
    } else {
      setResourceError(res.message ?? "Could not add resource.");
    }
  }

  async function deleteResource(resourceId: string) {
    if (!confirm("Remove this resource link?")) return;
    const res = await adminFetch(`/api/admin/lesson-resources?id=${resourceId}`, {
      method: "DELETE",
    });
    if (res.success) {
      await refreshCurrentContent();
      setManagingResourcesLesson((current) =>
        current
          ? {
              ...current,
              resources: (current.resources ?? []).filter((resource) => resource.id !== resourceId),
            }
          : current,
      );
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Course content"
        description="Organise your course into sections and lessons. Use plain names like “Chapter 1” or “Introduction”."
      />

      <AdminCard className="mb-6">
        <AdminField label="Select a course" hint="Pick which course you want to edit">
          <AdminSelect value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Choose a course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
      </AdminCard>

      {loading ? (
        <AdminLoading label="Loading content..." />
      ) : !courseId ? (
        <AdminEmpty title="Select a course" description="Choose a course above to manage its content." />
      ) : (
        <div className="relative grid gap-6 lg:grid-cols-2">
          {contentLoading ? (
            <div className="absolute right-0 top-[-3rem] rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
              Refreshing structure...
            </div>
          ) : null}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminCard>
              <AdminCardTitle>Add a new section</AdminCardTitle>
              <p className="mb-4 text-sm text-slate-600">
                Sections group related lessons together (e.g. “Module 1: Algebra”).
              </p>
              <form onSubmit={addModule} className="flex gap-2">
                <AdminInput
                  placeholder="Section name"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="flex-1"
                />
                <AdminButton type="submit" isLoading={saving}>
                  <Plus className="h-4 w-4" />
                  Add
                </AdminButton>
              </form>
            </AdminCard>

            <AdminCard>
              <AdminCardTitle>Add a new lesson</AdminCardTitle>
              <form onSubmit={addLesson} className="space-y-4">
                <AdminField label="Which section?" hint="The lesson will appear inside this section">
                  <AdminSelect
                    value={lessonModuleId}
                    onChange={(e) => setLessonModuleId(e.target.value)}
                  >
                    <option value="">Choose a section...</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Lesson name">
                  <AdminInput
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g. Introduction to fractions"
                  />
                </AdminField>
                <AdminField label="Brief description">
                  <AdminTextarea
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="min-h-[80px]"
                  />
                </AdminField>
                <AdminField label="Lesson type">
                  <AdminSelect
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as typeof lessonType)}
                  >
                    <option value="VIDEO">Video lesson</option>
                    <option value="READING">Reading material</option>
                    <option value="QUIZ">Quiz or exam</option>
                  </AdminSelect>
                </AdminField>
                {lessonType === "VIDEO" ? (
                  <>
                    <AdminField label="YouTube link or video ID" hint="Paste a YouTube watch, Shorts, Live, or youtu.be link">
                      <AdminInput
                        value={youtubeId}
                        onChange={(e) => setYoutubeId(e.target.value)}
                        placeholder="https://youtu.be/dQw4w9WgXcQ"
                      />
                    </AdminField>
                    <AdminField
                      label="Video length (minutes)"
                      hint="Enter the lesson duration manually. Total course hours are calculated from all lessons."
                    >
                      <AdminInput
                        type="number"
                        min={1}
                        max={600}
                        value={lessonDurationMinutes}
                        onChange={(e) => setLessonDurationMinutes(e.target.value)}
                        placeholder="e.g. 18"
                      />
                    </AdminField>
                  </>
                ) : null}
                {lessonType === "QUIZ" ? (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-navy/65">
                    After you add this quiz lesson, you&apos;ll be taken to{" "}
                    <span className="font-bold text-accent">Quizzes &amp; Exams</span> to write the
                    questions.
                  </div>
                ) : (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-navy/65">
                    After adding the lesson, open{" "}
                    <Link
                      href={
                        courseId
                          ? `/admin/quizzes?courseId=${encodeURIComponent(courseId)}`
                          : "/admin/quizzes"
                      }
                      className="font-bold text-accent hover:underline"
                    >
                      Quizzes &amp; Exams
                    </Link>{" "}
                    to attach optional pop-quiz questions.
                  </div>
                )}
                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                <AdminButton type="submit" isLoading={saving}>
                  Add lesson
                </AdminButton>
              </form>
            </AdminCard>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AdminCard>
              <AdminCardTitle>Current structure</AdminCardTitle>
              {modules.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No sections yet. Add one to get started.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {modules.map((mod) => (
                    <div key={mod.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-accent" />
                          <h4 className="font-semibold text-navy">{mod.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditModule(mod)}
                            className="text-slate-400 hover:text-accent transition cursor-pointer"
                            aria-label="Edit section"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteModule(mod.id)}
                            className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                            aria-label="Delete section"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {mod.lessons.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500">No lessons in this section</p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {mod.lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span className="text-navy">
                                {lesson.title}{" "}
                                <span className="text-xs text-slate-500">({lesson.type.toLowerCase()})</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => startManageResources(lesson as Lesson)}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-navy transition hover:bg-slate-200"
                                  title={`Manage resources for ${lesson.title}`}
                                >
                                  Resources
                                  {(lesson as Lesson).resources?.length
                                    ? ` (${(lesson as Lesson).resources!.length})`
                                    : ""}
                                </button>
                                <Link
                                  href={`/admin/quizzes?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lesson.id)}`}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10"
                                  title={`Manage quiz for ${lesson.title}`}
                                >
                                  Quiz
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => startEditLesson(lesson as Lesson)}
                                  className="text-slate-400 hover:text-accent transition cursor-pointer"
                                  aria-label="Edit lesson"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteLesson(lesson.id)}
                                  className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  aria-label="Delete lesson"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </motion.div>
        </div>
      )}

      {/* Edit Section Modal */}
      <Modal
        isOpen={editingModule !== null}
        onClose={() => setEditingModule(null)}
        title="Edit Section"
      >
        <form onSubmit={saveModule} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-navy">Edit Section</h3>
          <AdminField label="Section Name">
            <AdminInput
              value={editModuleTitle}
              onChange={(e) => setEditModuleTitle(e.target.value)}
              placeholder="Section name"
              required
            />
          </AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() => setEditingModule(null)}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" isLoading={saving}>
              Save Changes
            </AdminButton>
          </div>
        </form>
      </Modal>

      {/* Edit Lesson Modal */}
      <Modal
        isOpen={editingLesson !== null}
        onClose={() => setEditingLesson(null)}
        title="Edit Lesson"
      >
        <form onSubmit={saveLesson} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-navy">Edit Lesson</h3>
          <AdminField label="Lesson name">
            <AdminInput
              value={editLessonTitle}
              onChange={(e) => setEditLessonTitle(e.target.value)}
              placeholder="e.g. Introduction to fractions"
              required
            />
          </AdminField>
          <AdminField label="Brief description">
            <AdminTextarea
              value={editLessonDescription}
              onChange={(e) => setEditLessonDescription(e.target.value)}
              className="min-h-[80px]"
              required
            />
          </AdminField>
          <AdminField label="Lesson type">
            <AdminSelect
              value={editLessonType}
              onChange={(e) => setEditLessonType(e.target.value as typeof editLessonType)}
            >
              <option value="VIDEO">Video lesson</option>
              <option value="READING">Reading material</option>
              <option value="QUIZ">Quiz or exam</option>
            </AdminSelect>
          </AdminField>
          {editLessonType === "VIDEO" ? (
            <>
              <AdminField label="YouTube link or video ID" hint="Paste a YouTube watch, Shorts, Live, or youtu.be link">
                <AdminInput
                  value={editLessonYoutubeId}
                  onChange={(e) => setEditLessonYoutubeId(e.target.value)}
                  placeholder="https://youtu.be/dQw4w9WgXcQ"
                  required
                />
              </AdminField>
              <AdminField
                label="Video length (minutes)"
                hint="Used to calculate total course duration on the public course page."
              >
                <AdminInput
                  type="number"
                  min={1}
                  max={600}
                  value={editLessonDurationMinutes}
                  onChange={(e) => setEditLessonDurationMinutes(e.target.value)}
                  placeholder="e.g. 18"
                />
              </AdminField>
            </>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() => setEditingLesson(null)}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" isLoading={saving}>
              Save Changes
            </AdminButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={managingResourcesLesson !== null}
        onClose={() => setManagingResourcesLesson(null)}
        title="Lesson resources"
      >
        <div className="space-y-5 p-6">
          <div>
            <h3 className="text-lg font-bold text-navy">Lesson resources</h3>
            <p className="mt-1 text-sm text-slate-600">
              Add links students can open from the Resources tab — Google Drive, Google Docs, PDF
              links, etc.
            </p>
            {managingResourcesLesson ? (
              <p className="mt-2 text-sm font-medium text-accent">
                {managingResourcesLesson.title}
              </p>
            ) : null}
          </div>

          {(managingResourcesLesson?.resources ?? []).length > 0 ? (
            <ul className="space-y-2">
              {managingResourcesLesson!.resources!.map((resource) => (
                <li
                  key={resource.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm font-medium text-navy hover:text-accent"
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">{resource.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteResource(resource.id)}
                    className="shrink-0 text-slate-400 transition hover:text-red-600"
                    aria-label={`Remove ${resource.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No resources yet. Paste a Google Drive share link below.
            </p>
          )}

          <form onSubmit={addResource} className="space-y-4 border-t border-slate-100 pt-5">
            <AdminField label="Resource name" hint="What students will see, e.g. Chapter notes PDF">
              <AdminInput
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Study notes"
                required
              />
            </AdminField>
            <AdminField
              label="Link"
              hint="Paste a Google Drive / Docs link. Set sharing to Anyone with the link."
            >
              <AdminInput
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                required
              />
            </AdminField>
            {resourceError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {resourceError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => setManagingResourcesLesson(null)}
              >
                Done
              </AdminButton>
              <AdminButton type="submit" isLoading={saving}>
                Add link
              </AdminButton>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
