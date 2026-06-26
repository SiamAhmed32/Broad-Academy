"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

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

type CourseOption = { id: string; title: string };
type LessonOption = { id: string; title: string; type: string };
type Module = { id: string; title: string; lessons: LessonOption[] };
type ContentResponse = {
  courses: CourseOption[];
  course: { id: string; modules: Module[] } | null;
};

type QuizOption = { text: string; isCorrect: boolean; displayOrder: number };
type QuizQuestion = {
  prompt: string;
  explanation: string;
  displayOrder: number;
  options: QuizOption[];
};

type Quiz = {
  title: string;
  description: string;
  passPercent: number;
  timeLimitSeconds: number | null;
  questions: QuizQuestion[];
};

type QuizApiPayload = Quiz & { questions: QuizQuestion[] };

const emptyQuiz = (): Quiz => ({
  title: "",
  description: "",
  passPercent: 60,
  timeLimitSeconds: null,
  questions: [emptyQuestion()],
});

const emptyQuestion = (): QuizQuestion => ({
  prompt: "",
  explanation: "",
  displayOrder: 0,
  options: [
    { text: "", isCorrect: true, displayOrder: 0 },
    { text: "", isCorrect: false, displayOrder: 1 },
  ],
});

function mapQuizFromApi(data: QuizApiPayload): Quiz {
  return {
    title: data.title,
    description: data.description ?? "",
    passPercent: data.passPercent,
    timeLimitSeconds: data.timeLimitSeconds ?? null,
    questions: data.questions.map((q, qi) => ({
      prompt: q.prompt,
      explanation: q.explanation ?? "",
      displayOrder: qi,
      options: q.options.map((o, oi) => ({
        text: o.text,
        isCorrect: o.isCorrect,
        displayOrder: oi,
      })),
    })),
  };
}

export default function AdminQuizzesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const loadQuizRequestRef = useRef(0);
  const contentCacheRef = useRef(new Map<string, Module[]>());
  const lastLoadedCourseIdRef = useRef("");
  const initialCourseId = searchParams.get("courseId") ?? "";
  const initialLessonId = searchParams.get("lessonId") ?? "";

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [quiz, setQuiz] = useState<Quiz>(emptyQuiz());

  const syncUrl = useCallback(
    (nextCourseId: string, nextLessonId: string) => {
      const params = new URLSearchParams();
      if (nextCourseId) params.set("courseId", nextCourseId);
      if (nextLessonId) params.set("lessonId", nextLessonId);
      const query = params.toString();
      router.replace(query ? `/admin/quizzes?${query}` : "/admin/quizzes", { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    adminFetch<ContentResponse>("/api/admin/content").then((res) => {
      if (res.success && res.data?.courses) {
        setCourses(res.data.courses);
        if (res.data.course) {
          contentCacheRef.current.set(res.data.course.id, res.data.course.modules);
        }

        const nextCourseId =
          initialCourseId && res.data.courses.some((course) => course.id === initialCourseId)
            ? initialCourseId
            : res.data.course?.id ?? res.data.courses[0]?.id ?? "";

        setCourseId(nextCourseId);
      }
      setLoading(false);
    });
  }, [initialCourseId]);

  const applyModules = useCallback(
    (id: string, nextModules: Module[], preferredLessonId?: string) => {
      setModules(nextModules);
      const lessons = nextModules.flatMap((module) => module.lessons);
      const nextLessonId =
        preferredLessonId && lessons.some((lesson) => lesson.id === preferredLessonId)
          ? preferredLessonId
          : lessons[0]?.id ?? "";
      setLessonId(nextLessonId);
      syncUrl(id, nextLessonId);
    },
    [syncUrl],
  );

  const loadContent = useCallback(
    async (id: string, preferredLessonId?: string) => {
      if (!id) return;
      if (lastLoadedCourseIdRef.current === id && modules.length > 0) return;

      const cachedModules = contentCacheRef.current.get(id);
      if (cachedModules) {
        lastLoadedCourseIdRef.current = id;
        applyModules(id, cachedModules, preferredLessonId);
        return;
      }

      setContentLoading(true);
      const res = await adminFetch<{ course: { modules: Module[] } | null }>(
        `/api/admin/content?courseId=${id}`,
      );
      if (res.success && res.data?.course) {
        contentCacheRef.current.set(id, res.data.course.modules);
        lastLoadedCourseIdRef.current = id;
        applyModules(id, res.data.course.modules, preferredLessonId);
      } else {
        setModules([]);
        setLessonId("");
        syncUrl(id, "");
      }
      setContentLoading(false);
    },
    [applyModules, modules.length, syncUrl],
  );

  const loadQuiz = useCallback(async (id: string) => {
    if (!id) {
      setQuiz(emptyQuiz());
      return;
    }

    const requestId = ++loadQuizRequestRef.current;
    const res = await adminFetch<QuizApiPayload | null>(`/api/admin/quizzes/${id}`);

    if (requestId !== loadQuizRequestRef.current) return;

    if (res.success && res.data) {
      setQuiz(mapQuizFromApi(res.data));
    } else {
      setQuiz(emptyQuiz());
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      void loadContent(courseId, lessonId || initialLessonId || undefined);
    }
    // Only reload structure when the course changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, loadContent]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
    if (lessonId) {
      void loadQuiz(lessonId);
    } else {
      setQuiz(emptyQuiz());
    }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lessonId, loadQuiz]);

  const lessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title })),
  );

  function handleCourseChange(nextCourseId: string) {
    setCourseId(nextCourseId);
    setLessonId("");
    setSaved(false);
    setError("");
  }

  function handleLessonChange(nextLessonId: string) {
    setLessonId(nextLessonId);
    setSaved(false);
    setError("");
    syncUrl(courseId, nextLessonId);
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }

  function updateOption(qIndex: number, oIndex: number, patch: Partial<QuizOption>) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === qIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === oIndex ? { ...o, ...patch } : o)),
            }
          : q,
      ),
    }));
  }

  function addOption(qIndex: number) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) =>
        index === qIndex && question.options.length < 6
          ? {
              ...question,
              options: [
                ...question.options,
                {
                  text: "",
                  isCorrect: false,
                  displayOrder: question.options.length,
                },
              ],
            }
          : question,
      ),
    }));
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) =>
        index === qIndex && question.options.length > 2
          ? {
              ...question,
              options: question.options
                .filter((_, optionIndex) => optionIndex !== oIndex)
                .map((option, displayOrder) => ({ ...option, displayOrder })),
            }
          : question,
      ),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonId) return;
    setError("");
    setSaved(false);

    const invalidQuestion = quiz.questions.findIndex((question) => {
      const filledOptions = question.options.filter((option) => option.text.trim());
      return (
        !question.prompt.trim() ||
        filledOptions.length < 2 ||
        !filledOptions.some((option) => option.isCorrect)
      );
    });

    if (invalidQuestion >= 0) {
      setError(
        `Question ${invalidQuestion + 1} needs text, at least two answers, and at least one correct answer.`,
      );
      return;
    }

    if (!quiz.title.trim()) {
      setError("Add a quiz title before saving.");
      return;
    }

    setSaving(true);
    const payload = {
      lessonId,
      title: quiz.title.trim(),
      description: quiz.description.trim() || null,
      passPercent: quiz.passPercent,
      timeLimitSeconds: quiz.timeLimitSeconds,
      questions: quiz.questions.map((q, qi) => ({
        prompt: q.prompt.trim(),
        explanation: q.explanation.trim() || null,
        displayOrder: qi,
        options: q.options
          .filter((o) => o.text.trim())
          .map((o, oi) => ({ text: o.text.trim(), isCorrect: o.isCorrect, displayOrder: oi })),
      })),
    };

    const response = await adminFetch<QuizApiPayload>(`/api/admin/quizzes/${lessonId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!response.success) {
      setError(response.message ?? "Could not save the quiz.");
      return;
    }

    if (response.data) {
      setQuiz(mapQuizFromApi(response.data));
    }
    setSaved(true);
    syncUrl(courseId, lessonId);
  }

  if (loading) return <AdminLoading label="Loading..." />;

  return (
    <div>
      <AdminPageHeader
        title="Lesson quizzes & exams"
        description="Attach a short pop quiz to any video or reading lesson, or build a dedicated quiz lesson."
      />

      <AdminCard className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Course">
            <AdminSelect value={courseId} onChange={(e) => handleCourseChange(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField
            label="Lesson"
            hint={
              lessons.length === 0
                ? "No lessons in this course yet"
                : "Choose any lesson that should have a quiz"
            }
          >
            <AdminSelect
              value={lessonId}
              onChange={(e) => handleLessonChange(e.target.value)}
              disabled={contentLoading || lessons.length === 0}
            >
              <option value="">Choose a lesson...</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.moduleTitle} — {l.title} ({l.type.toLowerCase()})
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
        {courseId && lessons.length === 0 && !contentLoading ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This course has no lessons yet. Add lessons in{" "}
            <Link href="/admin/content" className="font-semibold text-accent hover:underline">
              Course content
            </Link>{" "}
            first, then return here to attach quiz questions.
          </p>
        ) : null}
      </AdminCard>

      {!lessonId ? (
        <AdminEmpty
          title="No lesson selected"
          description="Create a course lesson first, then select it here to attach questions."
        />
      ) : (
        <motion.form
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave}
          className="space-y-6"
        >
          <AdminCard>
            <AdminCardTitle>Quiz settings</AdminCardTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AdminField label="Quiz title">
                <AdminInput
                  required
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  placeholder="e.g. Chapter 1 check"
                />
              </AdminField>
              <AdminField label="Pass mark (%)" hint="Minimum score to pass">
                <AdminInput
                  type="number"
                  min={1}
                  max={100}
                  value={quiz.passPercent}
                  onChange={(e) => setQuiz({ ...quiz, passPercent: Number(e.target.value) })}
                />
              </AdminField>
              <AdminField label="Time limit (minutes)" hint="Leave empty for untimed quiz">
                <AdminInput
                  type="number"
                  min={1}
                  max={120}
                  value={quiz.timeLimitSeconds ? Math.round(quiz.timeLimitSeconds / 60) : ""}
                  onChange={(e) => {
                    const minutes = e.target.value ? Number(e.target.value) : null;
                    setQuiz({
                      ...quiz,
                      timeLimitSeconds: minutes ? minutes * 60 : null,
                    });
                  }}
                  placeholder="Untimed"
                />
              </AdminField>
              <div className="sm:col-span-2">
                <AdminField label="Instructions (optional)">
                  <AdminTextarea
                    value={quiz.description}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                    className="min-h-[80px]"
                  />
                </AdminField>
              </div>
            </div>
          </AdminCard>

          {quiz.questions.map((question, qIndex) => (
            <AdminCard key={qIndex}>
              <div className="mb-4 flex items-center justify-between">
                <AdminCardTitle>Question {qIndex + 1}</AdminCardTitle>
                {quiz.questions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setQuiz((prev) => ({
                        ...prev,
                        questions: prev.questions.filter((_, i) => i !== qIndex),
                      }))
                    }
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <AdminField label="Question text">
                <AdminTextarea
                  required
                  value={question.prompt}
                  onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                  className="min-h-[80px]"
                />
              </AdminField>
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-navy">Answer options</p>
                <p className="text-xs text-slate-500">
                  Tick every correct answer. Questions can have one or multiple correct answers.
                </p>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(event) =>
                        updateOption(qIndex, oIndex, { isCorrect: event.target.checked })
                      }
                      className="h-4 w-4 rounded text-accent"
                      aria-label={`Mark option ${oIndex + 1} as correct`}
                    />
                    <AdminInput
                      placeholder={`Option ${oIndex + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      disabled={question.options.length <= 2}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label={`Remove option ${oIndex + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {question.options.length < 6 ? (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-navy"
                  >
                    <Plus className="h-4 w-4" />
                    Add answer option
                  </button>
                ) : null}
              </div>
              <AdminField label="Explanation (optional)" className="mt-4">
                <AdminInput
                  value={question.explanation}
                  onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                  placeholder="Shown after answering"
                />
              </AdminField>
            </AdminCard>
          ))}

          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Quiz saved. Students will see a &quot;Lesson quiz&quot; tab on this lesson.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() =>
                setQuiz((prev) => ({
                  ...prev,
                  questions: [...prev.questions, emptyQuestion()],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Add question
            </AdminButton>
            <AdminButton type="submit" isLoading={saving}>
              Save quiz
            </AdminButton>
          </div>
        </motion.form>
      )}
    </div>
  );
}
