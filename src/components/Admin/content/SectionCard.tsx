"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { AdminInput } from "@/components/Admin";
import { cn } from "@/lib/utils";

import { LESSON_TYPES, formatMinutes, quizHref, type Lesson, type Module } from "./types";

type SectionCardProps = {
  module: Module;
  index: number;
  total: number;
  courseId: string;
  collapsed: boolean;
  reordering: boolean;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onRename: (title: string) => Promise<boolean>;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onMoveLesson: (lessonIndex: number, direction: -1 | 1) => void;
};

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy disabled:pointer-events-none disabled:opacity-30";

export function SectionCard({
  module,
  index,
  total,
  courseId,
  collapsed,
  reordering,
  onToggle,
  onMove,
  onRename,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onMoveLesson,
}: SectionCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(module.title);
  const [savingTitle, setSavingTitle] = useState(false);

  const totalSeconds = module.lessons.reduce((sum, l) => sum + l.durationSeconds, 0);
  const lessonLabel = `${module.lessons.length} ${module.lessons.length === 1 ? "lesson" : "lessons"}`;
  const duration = formatMinutes(totalSeconds);

  async function submitRename(event: React.FormEvent) {
    event.preventDefault();
    const next = draftTitle.trim();
    if (next === module.title) {
      setRenaming(false);
      return;
    }
    setSavingTitle(true);
    const ok = await onRename(next);
    setSavingTitle(false);
    if (ok) setRenaming(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
          {String(index + 1).padStart(2, "0")}
        </span>

        {renaming ? (
          <form onSubmit={submitRename} className="flex min-w-0 flex-1 items-center gap-2">
            <AdminInput
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraftTitle(module.title);
                  setRenaming(false);
                }
              }}
              aria-label="Chapter name"
              className="h-9"
              maxLength={120}
              autoFocus
            />
            <button
              type="submit"
              disabled={savingTitle || draftTitle.trim().length < 2}
              className={cn(iconButton, "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700")}
              aria-label="Save chapter name"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftTitle(module.title);
                setRenaming(false);
              }}
              className={iconButton}
              aria-label="Cancel renaming"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="min-w-0 flex-1 text-left"
            aria-expanded={!collapsed}
          >
            <h3 className="truncate font-semibold text-navy">{module.title}</h3>
            <p className="text-xs text-slate-500">
              {lessonLabel}
              {duration ? ` · ${duration}` : ""}
            </p>
          </button>
        )}

        {!renaming ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0 || reordering}
              className={cn(iconButton, "hidden sm:flex")}
              aria-label="Move chapter up"
              title="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1 || reordering}
              className={cn(iconButton, "hidden sm:flex")}
              aria-label="Move chapter down"
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftTitle(module.title);
                setRenaming(true);
              }}
              className={iconButton}
              aria-label="Rename chapter"
              title="Rename"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={cn(iconButton, "hover:bg-red-50 hover:text-red-600")}
              aria-label="Delete chapter"
              title="Delete chapter"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </header>

      {!collapsed ? (
        <div className="p-3 sm:p-4">
          {module.lessons.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-500">No lessons in this chapter yet.</p>
          ) : (
            <ol className="space-y-2">
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  courseId={courseId}
                  isFirst={lessonIndex === 0}
                  isLast={lessonIndex === module.lessons.length - 1}
                  reordering={reordering}
                  onEdit={() => onEditLesson(lesson)}
                  onDelete={() => onDeleteLesson(lesson)}
                  onMove={(direction) => onMoveLesson(lessonIndex, direction)}
                />
              ))}
            </ol>
          )}

          <button
            type="button"
            onClick={onAddLesson}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
          >
            <Plus className="h-4 w-4" />
            Add a lesson to this chapter
          </button>
        </div>
      ) : null}
    </section>
  );
}

function LessonRow({
  lesson,
  courseId,
  isFirst,
  isLast,
  reordering,
  onEdit,
  onDelete,
  onMove,
}: {
  lesson: Lesson;
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
  reordering: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const meta = LESSON_TYPES[lesson.type];
  const Icon = meta.icon;
  const duration = formatMinutes(lesson.durationSeconds);
  const fileCount = lesson.resources?.length ?? 0;
  const questionCount = lesson.quiz?._count.questions ?? 0;
  const isQuiz = lesson.type === "QUIZ";

  return (
    <li className="group flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white px-2 py-2 transition hover:border-slate-200 hover:bg-slate-50/60 sm:flex-nowrap sm:px-3">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst || reordering}
          className="rounded p-0.5 text-slate-300 transition hover:bg-slate-200 hover:text-navy disabled:pointer-events-none disabled:opacity-30"
          aria-label="Move lesson up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast || reordering}
          className="rounded p-0.5 text-slate-300 transition hover:bg-slate-200 hover:text-navy disabled:pointer-events-none disabled:opacity-30"
          aria-label="Move lesson down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
        <Icon className="h-4 w-4" />
      </span>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-navy group-hover:text-accent">
          {lesson.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span>{meta.label}</span>
          {duration ? <span>· {duration}</span> : null}
          {fileCount ? (
            <span className="inline-flex items-center gap-1">
              · <Paperclip className="h-3 w-3" /> {fileCount} {fileCount === 1 ? "file" : "files"}
            </span>
          ) : null}
          {isQuiz && questionCount === 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600">
              · <CircleAlert className="h-3 w-3" /> No questions yet
            </span>
          ) : questionCount ? (
            <span>
              · {questionCount} {questionCount === 1 ? "question" : "questions"}
            </span>
          ) : null}
        </p>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-navy transition hover:bg-slate-200"
        >
          Edit
        </button>
        <Link
          href={quizHref(courseId, lesson.id)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
            isQuiz && questionCount === 0
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "text-accent hover:bg-accent/10",
          )}
          title={isQuiz ? "Write the quiz questions" : "Add an optional pop quiz to this lesson"}
        >
          {isQuiz ? "Questions" : questionCount ? "Pop quiz" : "+ Quiz"}
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${lesson.title}`}
          title="Delete lesson"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
