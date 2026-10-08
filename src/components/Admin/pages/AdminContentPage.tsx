"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FolderPlus,
  Layers,
  ListChecks,
  Paperclip,
  Plus,
  Settings2,
} from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminSelect,
  useAdminToast,
} from "@/components/Admin";
import {
  LessonEditorModal,
  type LessonEditorState,
} from "@/components/Admin/content/LessonEditorModal";
import { SectionCard } from "@/components/Admin/content/SectionCard";
import {
  formatMinutes,
  quizHref,
  type ContentResponse,
  type CourseOption,
  type Lesson,
  type Module,
} from "@/components/Admin/content/types";
import { useAdminCan } from "@/components/Admin/AdminPermissionsContext";
import { adminFetch } from "@/lib/admin/client";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

type PendingDelete =
  | { kind: "module"; id: string; title: string; lessonCount: number }
  | { kind: "lesson"; id: string; title: string };

const statusTone: Record<string, "success" | "muted" | "warning"> = {
  PUBLISHED: "success",
  DRAFT: "muted",
  ARCHIVED: "warning",
};

export default function AdminContentPage() {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const requestIdRef = useRef(0);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reordering, setReordering] = useState(false);
  const [newChapter, setNewChapter] = useState("");
  const [addingChapter, setAddingChapter] = useState(false);
  const [editor, setEditor] = useState<LessonEditorState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const canEdit = useAdminCan(ADMIN_PERMISSIONS.CONTENT);
  const [deleting, setDeleting] = useState(false);

  const applyContent = useCallback(
    (res: Awaited<ReturnType<typeof fetchContent>>, requestId: number) => {
      // Ignore responses for a course the admin has already switched away from.
      if (requestId !== requestIdRef.current) return;

      if (res.success && res.data) {
        const selected = res.data.selectedCourseId ?? "";
        setCourses(res.data.courses);
        setCourseId(selected);
        setModules(res.data.course?.modules ?? []);
        if (selected) {
          window.history.replaceState(null, "", `?courseId=${encodeURIComponent(selected)}`);
        }
      } else {
        showToast(res.message ?? "Could not load the course content.", true);
      }
      setLoading(false);
      setSwitching(false);
    },
    [showToast],
  );

  const loadCourse = useCallback(
    async (id?: string) => {
      const requestId = ++requestIdRef.current;
      applyContent(await fetchContent(id), requestId);
    },
    [applyContent],
  );

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("courseId") ?? undefined;
    const requestId = ++requestIdRef.current;
    void fetchContent(fromUrl).then((res) => applyContent(res, requestId));
  }, [applyContent]);

  const refresh = useCallback(async () => {
    if (courseId) await loadCourse(courseId);
  }, [courseId, loadCourse]);

  function selectCourse(id: string) {
    if (!id || id === courseId) return;
    setSwitching(true);
    setCourseId(id);
    setCollapsed(new Set());
    void loadCourse(id);
  }

  // ---- Chapters ----

  async function addChapter(event: React.FormEvent) {
    event.preventDefault();
    const title = newChapter.trim();
    if (title.length < 2) {
      showToast("Write a chapter name (at least 2 letters).", true);
      return;
    }
    setAddingChapter(true);
    const res = await adminFetch("/api/admin/modules", {
      method: "POST",
      body: JSON.stringify({ courseId, title }),
    });
    if (res.success) {
      setNewChapter("");
      await refresh();
      showToast("Chapter added. Now add lessons to it.");
    } else {
      showToast(res.message ?? "Could not add the chapter.", true);
    }
    setAddingChapter(false);
  }

  async function renameChapter(id: string, title: string, label: string) {
    if (title.length < 2) {
      showToast("Write a chapter name (at least 2 letters).", true);
      return false;
    }
    const res = await adminFetch("/api/admin/modules", {
      method: "PATCH",
      body: JSON.stringify({ id, title, label: label || null }),
    });
    if (!res.success) {
      showToast(res.message ?? "Could not rename the chapter.", true);
      return false;
    }
    setModules((current) =>
      current.map((m) => (m.id === id ? { ...m, title, label: label || null } : m)),
    );
    showToast("Chapter updated.");
    return true;
  }

  async function moveChapter(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    setModules(next);
    setReordering(true);
    const res = await adminFetch("/api/admin/modules/reorder", {
      method: "PUT",
      body: JSON.stringify({ courseId, ids: next.map((m) => m.id) }),
    });
    if (!res.success) {
      showToast(res.message ?? "Could not change the order.", true);
      await refresh();
    }
    setReordering(false);
  }

  // ---- Lessons ----

  async function moveLesson(moduleId: string, index: number, direction: -1 | 1) {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const target = index + direction;
    if (target < 0 || target >= mod.lessons.length) return;
    const lessons = [...mod.lessons];
    [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
    setModules((current) => current.map((m) => (m.id === moduleId ? { ...m, lessons } : m)));
    setReordering(true);
    const res = await adminFetch("/api/admin/lessons/reorder", {
      method: "PUT",
      body: JSON.stringify({ moduleId, ids: lessons.map((l) => l.id) }),
    });
    if (!res.success) {
      showToast(res.message ?? "Could not change the order.", true);
      await refresh();
    }
    setReordering(false);
  }

  const handleLessonCreated = useCallback(
    async ({ id, type }: { id: string; type: Lesson["type"] }) => {
      if (type === "QUIZ") {
        showToast("Quiz lesson saved. Now write the questions.");
        setEditor(null);
        router.push(quizHref(courseId, id));
        return;
      }
      await refresh();
      showToast("Lesson saved.");
      // Keep the dialog open on the new lesson so files can be attached straight away.
      setEditor({ mode: "edit", lessonId: id, justCreated: true });
    },
    [courseId, refresh, router, showToast],
  );

  // ---- Delete ----

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const url =
      pendingDelete.kind === "module"
        ? `/api/admin/modules?id=${encodeURIComponent(pendingDelete.id)}`
        : `/api/admin/lessons?id=${encodeURIComponent(pendingDelete.id)}`;
    const res = await adminFetch(url, { method: "DELETE" });
    if (res.success) {
      await refresh();
      showToast(pendingDelete.kind === "module" ? "Chapter deleted." : "Lesson deleted.");
      setPendingDelete(null);
    } else {
      showToast(res.message ?? "Could not delete. Please try again.", true);
    }
    setDeleting(false);
  }

  // ---- Derived ----

  const course = courses.find((c) => c.id === courseId);
  const allLessons = modules.flatMap((m) => m.lessons);
  const totalDuration = formatMinutes(allLessons.reduce((sum, l) => sum + l.durationSeconds, 0));
  const videoCount = allLessons.filter((l) => l.type === "VIDEO").length;
  const quizCount = allLessons.filter((l) => l.type === "QUIZ").length;
  const fileCount = allLessons.reduce((sum, l) => sum + (l.resources?.length ?? 0), 0);

  function toggleChapter(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="Course content"
        description={
          canEdit
            ? "Build each course like a book: add chapters, then put video, reading and quiz lessons inside them."
            : "View-only: see what each course contains — chapters, videos, quizzes and files."
        }
        actions={
          course ? (
            <>
              <Link
                href={`/admin/courses/${course.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-slate-50"
              >
                <Settings2 className="h-4 w-4" />
                Course details
              </Link>
              <a
                href={`/courses/${course.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                View on website
              </a>
            </>
          ) : null
        }
      />

      {loading ? (
        <AdminLoading label="Loading content..." />
      ) : courses.length === 0 ? (
        <AdminEmpty
          title="No courses yet"
          description="Create a course first, then come back here to add its chapters and lessons."
          actionLabel="Go to Courses"
          onAction={() => router.push("/admin/courses")}
        />
      ) : (
        <>
          <AdminCard className="mb-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <AdminField label="Which course are you working on?">
                <AdminSelect value={courseId} onChange={(e) => selectCourse(e.target.value)}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                      {c.status !== "PUBLISHED" ? ` (${c.status.toLowerCase()})` : ""}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>

              {course ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <AdminBadge variant={statusTone[course.status] ?? "muted"}>
                    {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                  </AdminBadge>
                  <Stat icon={Layers} label={`${modules.length} chapters`} />
                  <Stat icon={ListChecks} label={`${allLessons.length} lessons`} />
                  {videoCount ? <Stat label={`${videoCount} videos`} /> : null}
                  {quizCount ? <Stat label={`${quizCount} quizzes`} /> : null}
                  {fileCount ? <Stat icon={Paperclip} label={`${fileCount} files`} /> : null}
                  {totalDuration ? <Stat label={totalDuration} /> : null}
                </div>
              ) : null}
            </div>
          </AdminCard>

          <div className={switching ? "pointer-events-none opacity-50 transition" : "transition"}>
            {modules.length === 0 ? <GettingStarted /> : null}

            <div className="space-y-4">
              {modules.map((mod, index) => (
                <SectionCard
                  key={mod.id}
                  module={mod}
                  index={index}
                  total={modules.length}
                  courseId={courseId}
                  collapsed={collapsed.has(mod.id)}
                  reordering={reordering}
                  onToggle={() => toggleChapter(mod.id)}
                  onMove={(direction) => moveChapter(index, direction)}
                  onRename={(title, label) => renameChapter(mod.id, title, label)}
                  onDelete={() =>
                    setPendingDelete({
                      kind: "module",
                      id: mod.id,
                      title: mod.title,
                      lessonCount: mod.lessons.length,
                    })
                  }
                  onAddLesson={() => setEditor({ mode: "create", moduleId: mod.id })}
                  onEditLesson={(lesson) => setEditor({ mode: "edit", lessonId: lesson.id })}
                  onDeleteLesson={(lesson) =>
                    setPendingDelete({ kind: "lesson", id: lesson.id, title: lesson.title })
                  }
                  onMoveLesson={(lessonIndex, direction) =>
                    moveLesson(mod.id, lessonIndex, direction)
                  }
                  readOnly={!canEdit}
                />
              ))}

              {canEdit ? (
              <form
                onSubmit={addChapter}
                className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-4 sm:p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-accent" />
                  <p className="font-semibold text-navy">
                    {modules.length === 0 ? "Add your first chapter" : "Add another chapter"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <AdminInput
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder={`e.g. Chapter ${modules.length + 1}: Motion`}
                    aria-label="New chapter name"
                    maxLength={120}
                    className="flex-1"
                  />
                  <AdminButton type="submit" isLoading={addingChapter} className="h-11">
                    <Plus className="h-4 w-4" />
                    Add chapter
                  </AdminButton>
                </div>
              </form>
              ) : null}
            </div>
          </div>
        </>
      )}

      <LessonEditorModal
        editor={editor}
        modules={modules}
        onClose={() => setEditor(null)}
        onCreated={handleLessonCreated}
        onChanged={refresh}
      />

      <AdminConfirmDialog
        open={pendingDelete !== null}
        variant="danger"
        title={pendingDelete?.kind === "module" ? "Delete this chapter?" : "Delete this lesson?"}
        description={
          pendingDelete?.kind === "module"
            ? `"${pendingDelete.title}" and its ${pendingDelete.lessonCount} ${
                pendingDelete.lessonCount === 1 ? "lesson" : "lessons"
              } will be removed for good, including student progress and quizzes inside it.`
            : pendingDelete
              ? `"${pendingDelete.title}" will be removed for good, including its files, quiz and student progress.`
              : ""
        }
        confirmLabel="Delete"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function fetchContent(courseId?: string) {
  return adminFetch<ContentResponse>(
    courseId ? `/api/admin/content?courseId=${encodeURIComponent(courseId)}` : "/api/admin/content",
  );
}

function Stat({ icon: Icon, label }: { icon?: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
  );
}

function GettingStarted() {
  const steps = [
    { title: "Add a chapter", body: "For example “Chapter 1: Motion”. Use the box below." },
    { title: "Add lessons", body: "Inside each chapter, add videos, reading notes or quizzes." },
    { title: "Attach files", body: "Add PDF or Google Drive links to any lesson (optional)." },
  ];
  return (
    <div className="mb-4 rounded-2xl border border-accent/15 bg-accent/5 p-5">
      <p className="font-semibold text-navy">This course is empty. Here&apos;s how to fill it:</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy">{step.title}</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
