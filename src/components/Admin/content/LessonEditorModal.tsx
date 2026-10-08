"use client";

import { useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Info,
  Link2,
  Paperclip,
  Trash2,
} from "lucide-react";

import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  useAdminToast,
} from "@/components/Admin";
import Modal from "@/components/reusables/Modal";
import { adminFetch } from "@/lib/admin/client";
import { cn } from "@/lib/utils";
import { extractYouTubeVideoId } from "@/lib/video/youtube";

import {
  LESSON_TYPES,
  PLACEHOLDER_DESCRIPTION,
  type Lesson,
  type LessonType,
  type Module,
} from "./types";

export type LessonEditorState =
  | { mode: "create"; moduleId: string }
  | { mode: "edit"; lessonId: string; justCreated?: boolean };

type LessonEditorModalProps = {
  editor: LessonEditorState | null;
  modules: Module[];
  onClose: () => void;
  /** Called after a new lesson is saved. The page decides what happens next. */
  onCreated: (lesson: { id: string; type: LessonType }) => Promise<void>;
  /** Called after any change so the page can reload the course structure. */
  onChanged: () => Promise<void>;
};

export function LessonEditorModal({
  editor,
  modules,
  onClose,
  onCreated,
  onChanged,
}: LessonEditorModalProps) {
  let lesson: Lesson | undefined;
  let moduleId = "";
  if (editor?.mode === "edit") {
    for (const mod of modules) {
      const found = mod.lessons.find((l) => l.id === editor.lessonId);
      if (found) {
        lesson = found;
        moduleId = mod.id;
        break;
      }
    }
  } else if (editor) {
    moduleId = editor.moduleId;
  }

  const formKey = editor?.mode === "edit" ? `edit-${editor.lessonId}` : `new-${moduleId}`;

  return (
    <Modal isOpen={editor !== null} onClose={onClose} title="Lesson" size="lg">
      {editor && (editor.mode === "create" || lesson) ? (
        <LessonEditorForm
          key={formKey}
          lesson={lesson}
          initialModuleId={moduleId}
          justCreated={editor.mode === "edit" && Boolean(editor.justCreated)}
          modules={modules}
          onClose={onClose}
          onCreated={onCreated}
          onChanged={onChanged}
        />
      ) : null}
    </Modal>
  );
}

type FormErrors = Partial<Record<"title" | "description" | "youtube" | "duration" | "content", string>>;

function LessonEditorForm({
  lesson,
  initialModuleId,
  justCreated,
  modules,
  onClose,
  onCreated,
  onChanged,
}: {
  lesson?: Lesson;
  initialModuleId: string;
  justCreated: boolean;
  modules: Module[];
  onClose: () => void;
  onCreated: LessonEditorModalProps["onCreated"];
  onChanged: LessonEditorModalProps["onChanged"];
}) {
  const isEdit = Boolean(lesson);
  const { showToast } = useAdminToast();

  const [type, setType] = useState<LessonType>(lesson?.type ?? "VIDEO");
  const [moduleId, setModuleId] = useState(initialModuleId);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(
    lesson && lesson.description !== PLACEHOLDER_DESCRIPTION ? lesson.description : "",
  );
  const [youtube, setYoutube] = useState(lesson?.youtubeVideoId ?? "");
  const [minutes, setMinutes] = useState(
    lesson && lesson.durationSeconds > 0
      ? String(Math.max(1, Math.round(lesson.durationSeconds / 60)))
      : "",
  );
  const [content, setContent] = useState(lesson?.content ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const videoId = youtube.trim() ? extractYouTubeVideoId(youtube) : null;
  const moduleTitle = modules.find((m) => m.id === moduleId)?.title;

  function validate() {
    const next: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 2) next.title = "Write a lesson name (at least 2 letters).";
    else if (trimmedTitle.length > 120) next.title = "Keep the name under 120 characters.";
    if (trimmedDescription && trimmedDescription.length < 5) {
      next.description = "Write at least 5 characters, or leave it empty.";
    }
    if (type === "VIDEO") {
      if (!youtube.trim()) next.youtube = "Paste the YouTube link for this video.";
      else if (!videoId) next.youtube = "This doesn't look like a YouTube link. Copy it again from YouTube.";
    }
    if (minutes && (Number(minutes) < 0 || Number(minutes) > 600)) {
      next.duration = "Enter minutes between 1 and 600.";
    }
    if (type === "READING" && content.length > 10000) {
      next.content = "Keep the text under 10,000 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    if (!isEdit && !moduleId) {
      showToast("Choose which chapter this lesson belongs to.", true);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || PLACEHOLDER_DESCRIPTION,
      type,
      youtubeVideoId: type === "VIDEO" ? videoId : null,
      durationSeconds:
        type !== "QUIZ" && minutes ? Math.max(0, Math.round(Number(minutes) * 60)) : 0,
      content: type === "READING" ? content.trim() || null : null,
    };

    setSaving(true);
    const res = await adminFetch<{ id: string }>("/api/admin/lessons", {
      method: isEdit ? "PATCH" : "POST",
      body: JSON.stringify(isEdit ? { id: lesson!.id, ...payload } : { moduleId, ...payload }),
    });

    if (!res.success) {
      setSaving(false);
      showToast(res.message ?? "Could not save the lesson. Please try again.", true);
      return;
    }

    if (isEdit) {
      await onChanged();
      setSaving(false);
      showToast("Lesson updated.");
      onClose();
    } else if (res.data?.id) {
      await onCreated({ id: res.data.id, type });
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="border-b border-slate-100 px-6 pb-4 pt-6 pr-14">
        <h3 className="text-lg font-semibold text-navy">
          {isEdit ? "Edit lesson" : "Add a lesson"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {moduleTitle ? (
            <>
              Chapter: <span className="font-medium text-navy">{moduleTitle}</span>
            </>
          ) : (
            "Fill in the details below."
          )}
        </p>
      </div>

      <div className="space-y-6 px-6 py-6">
        {justCreated ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Lesson saved. You can attach notes or PDF links below, or click{" "}
              <span className="font-semibold">Done</span>.
            </p>
          </div>
        ) : null}

        {/* Step 1: type */}
        <div>
          <p className="mb-2 text-sm font-medium text-navy">What kind of lesson is it?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(LESSON_TYPES) as LessonType[]).map((key) => {
              const meta = LESSON_TYPES[key];
              const Icon = meta.icon;
              const active = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                    active
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy">{meta.label}</span>
                    <span className="block text-xs leading-5 text-slate-500">{meta.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!isEdit && modules.length > 1 ? (
          <AdminField label="Chapter">
            <AdminSelect value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
              {modules.map((m, index) => (
                <option key={m.id} value={m.id}>
                  {index + 1}. {m.title}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        ) : null}

        <AdminField label="Lesson name" error={errors.title}>
          <AdminInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Newton's first law"
            invalid={Boolean(errors.title)}
            maxLength={120}
            autoFocus={!isEdit}
          />
        </AdminField>

        {type === "VIDEO" ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <AdminField
              label="YouTube link"
              hint="Open the video on YouTube, click Share, copy the link and paste it here."
              error={errors.youtube}
            >
              <AdminInput
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtu.be/..."
                invalid={Boolean(errors.youtube)}
                inputMode="url"
              />
            </AdminField>
            <AdminField label="Length (minutes)" error={errors.duration} className="sm:w-40">
              <AdminInput
                type="number"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g. 18"
                invalid={Boolean(errors.duration)}
              />
            </AdminField>
            {youtube.trim() ? (
              <div className="sm:col-span-2">
                {videoId ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
                      alt=""
                      className="h-14 w-24 shrink-0 rounded-lg bg-slate-200 object-cover"
                    />
                    <div className="min-w-0 text-sm">
                      <p className="flex items-center gap-1.5 font-medium text-emerald-700">
                        <CircleCheck className="h-4 w-4" /> Video link looks good
                      </p>
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-accent"
                      >
                        Open on YouTube <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-amber-700">
                    <CircleAlert className="h-3.5 w-3.5" /> We can&apos;t read a YouTube video
                    from this link yet.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {type === "READING" ? (
          <>
            <AdminField
              label="Reading text"
              hint="Students see this text on the lesson page. Line breaks are kept."
              error={errors.content}
            >
              <AdminTextarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste the lesson notes here..."
                className="min-h-[180px]"
                invalid={Boolean(errors.content)}
              />
            </AdminField>
            <AdminField label="Reading time in minutes (optional)" error={errors.duration} className="sm:w-60">
              <AdminInput
                type="number"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g. 10"
                invalid={Boolean(errors.duration)}
              />
            </AdminField>
          </>
        ) : null}

        <AdminField
          label="Short description (optional)"
          hint="One or two lines shown under the lesson name."
          error={errors.description}
        >
          <AdminTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
            invalid={Boolean(errors.description)}
          />
        </AdminField>

        {type === "QUIZ" ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isEdit
                ? "Use the Questions button on the lesson to add or change the quiz questions."
                : "After you save, you'll go straight to the page where you write the questions."}
            </p>
          </div>
        ) : null}

        {lesson ? (
          <LessonFiles lesson={lesson} onChanged={onChanged} />
        ) : type !== "QUIZ" ? (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Paperclip className="h-3.5 w-3.5" />
            You can attach PDF or Google Drive links right after saving.
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
        <AdminButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
          {justCreated ? "Done" : "Cancel"}
        </AdminButton>
        <AdminButton type="submit" isLoading={saving}>
          {isEdit
            ? "Save changes"
            : type === "QUIZ"
              ? "Save and write questions"
              : "Save lesson"}
        </AdminButton>
      </div>
    </form>
  );
}

function LessonFiles({
  lesson,
  onChanged,
}: {
  lesson: Lesson;
  onChanged: () => Promise<void>;
}) {
  const { showToast } = useAdminToast();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const resources = lesson.resources ?? [];

  // Nested inside the lesson <form>, so this is a button handler rather than a form submit.
  async function addFile() {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (trimmedName.length < 2) {
      showToast("Give the file a name, e.g. Chapter notes PDF.", true);
      return;
    }
    if (!trimmedUrl.startsWith("https://")) {
      showToast("Paste a full link that starts with https://", true);
      return;
    }
    setAdding(true);
    const res = await adminFetch("/api/admin/lesson-resources", {
      method: "POST",
      body: JSON.stringify({ lessonId: lesson.id, title: trimmedName, url: trimmedUrl }),
    });
    if (res.success) {
      await onChanged();
      setName("");
      setUrl("");
    } else {
      showToast(res.message ?? "Could not add the file link.", true);
    }
    setAdding(false);
  }

  async function removeFile(id: string) {
    setRemovingId(id);
    const res = await adminFetch(`/api/admin/lesson-resources?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.success) await onChanged();
    else showToast(res.message ?? "Could not remove the file link.", true);
    setRemovingId(null);
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-navy">Files &amp; notes</p>
        <span className="text-xs text-slate-500">(optional)</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Students open these from the Resources tab. Set Google Drive sharing to &quot;Anyone with
        the link&quot;.
      </p>

      {resources.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 text-sm font-medium text-navy hover:text-accent"
              >
                <Link2 className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate">{resource.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
              </a>
              <button
                type="button"
                onClick={() => removeFile(resource.id)}
                disabled={removingId === resource.id}
                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`Remove ${resource.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <AdminInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void addFile();
            }
          }}
          placeholder="File name, e.g. Chapter notes"
          aria-label="File name"
          className="h-10"
        />
        <AdminInput
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void addFile();
            }
          }}
          placeholder="https://drive.google.com/..."
          aria-label="File link"
          inputMode="url"
          className="h-10"
        />
        <AdminButton type="button" variant="secondary" onClick={addFile} isLoading={adding}>
          Add
        </AdminButton>
      </div>
    </div>
  );
}
