"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminImageUpload,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminTextarea,
  useAdminToast,
} from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";
import Link from "next/link";

type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
  displayOrder: number;
};

type Question = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  explanation: string | null;
  displayOrder: number;
  options: Option[];
};

type QuestionDraft = {
  localId: string;
  prompt: string;
  imageUrl: string;
  explanation: string;
  options: { localId: string; text: string; isCorrect: boolean }[];
};

function createEmptyQuestion(order: number): QuestionDraft {
  return {
    localId: `q-${Date.now()}-${order}`,
    prompt: "",
    imageUrl: "",
    explanation: "",
    options: [
      { localId: `o-${Date.now()}-0`, text: "", isCorrect: false },
      { localId: `o-${Date.now()}-1`, text: "", isCorrect: false },
      { localId: `o-${Date.now()}-2`, text: "", isCorrect: false },
      { localId: `o-${Date.now()}-3`, text: "", isCorrect: false },
    ],
  };
}

export default function AdminExamQuestionsPage({ examId, examTitle }: { examId: string; examTitle?: string }) {
  const { showToast, ToastViewport } = useAdminToast();
  const shouldReduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([createEmptyQuestion(0)]);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const result = await adminFetch<Question[]>(`/api/admin/exams/${examId}/questions`);
      if (result.success && result.data && result.data.length > 0) {
        setQuestions(
          result.data.map((q) => ({
            localId: q.id,
            prompt: q.prompt,
            imageUrl: q.imageUrl ?? "",
            explanation: q.explanation ?? "",
            options: q.options.map((o) => ({
              localId: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          })),
        );
        setExpandedIdx(0);
      }
      setLoading(false);
    }
    load();
  }, [examId]);

  function addQuestion() {
    const newQ = createEmptyQuestion(questions.length);
    setQuestions((prev) => [...prev, newQ]);
    setExpandedIdx(questions.length);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx((prev) => Math.min(prev, questions.length - 2));
  }

  function moveQuestion(idx: number, dir: "up" | "down") {
    setQuestions((prev) => {
      const next = [...prev];
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
    setExpandedIdx((prev) => {
      if (prev === idx) return dir === "up" ? idx - 1 : idx + 1;
      if (prev === (dir === "up" ? idx - 1 : idx + 1)) return idx;
      return prev;
    });
  }

  function updateQuestion(idx: number, field: keyof QuestionDraft, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function updateOption(
    qIdx: number,
    oIdx: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      const opts = [...q.options];

      if (field === "isCorrect" && value === true) {
        // Radio-style: clear others
        opts.forEach((o, i) => {
          opts[i] = { ...o, isCorrect: i === oIdx };
        });
      } else {
        opts[oIdx] = { ...opts[oIdx], [field]: value };
      }

      q.options = opts;
      next[qIdx] = q;
      return next;
    });
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      q.options = [
        ...q.options,
        { localId: `o-${Date.now()}`, text: "", isCorrect: false },
      ];
      next[qIdx] = q;
      return next;
    });
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIdx] };
      q.options = q.options.filter((_, i) => i !== oIdx);
      next[qIdx] = q;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);

    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        showToast(`Question ${i + 1} is missing its prompt.`, true);
        setExpandedIdx(i);
        setSaving(false);
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        showToast(`Question ${i + 1} must have one correct answer marked.`, true);
        setExpandedIdx(i);
        setSaving(false);
        return;
      }
      if (q.options.some((o) => !o.text.trim())) {
        showToast(`Question ${i + 1} has an empty option.`, true);
        setExpandedIdx(i);
        setSaving(false);
        return;
      }
    }

    const payload = {
      questions: questions.map((q, qi) => ({
        prompt: q.prompt.trim(),
        imageUrl: q.imageUrl || undefined,
        explanation: q.explanation || undefined,
        displayOrder: qi,
        options: q.options.map((o, oi) => ({
          text: o.text.trim(),
          isCorrect: o.isCorrect,
          displayOrder: oi,
        })),
      })),
    };

    const result = await adminFetch(`/api/admin/exams/${examId}/questions`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (result.success) {
      showToast("Questions saved successfully.");
    } else {
      showToast(result.message ?? "Failed to save questions.", true);
    }
    setSaving(false);
  }

  if (loading) return <AdminLoading />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Question Bank"
        description={examTitle ?? "Manage exam questions"}
        actions={
          <div className="flex gap-3">
            <Link href="/admin/exams">
              <AdminButton variant="ghost">
                <ChevronLeft size={16} /> Back to Exams
              </AdminButton>
            </Link>
            <AdminButton
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              isLoading={saving}
            >
              {!saving && <Check size={16} />} Save All Questions
            </AdminButton>
          </div>
        }
      />

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <AdminCard key={q.localId} className="overflow-hidden">
            {/* Question header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedIdx(expandedIdx === qi ? -1 : qi)}
            >
              <GripVertical size={18} className="text-slate-500 flex-shrink-0" />
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {qi + 1}
              </span>
              <p className="flex-1 text-sm text-navy font-semibold truncate">
                {q.prompt || <span className="text-slate-500 italic">Untitled question</span>}
              </p>
              <div className="flex items-center gap-1">
                {q.options.some((o) => o.isCorrect) && (
                  <AdminBadge variant="success" className="text-xs">✓ Answer set</AdminBadge>
                )}
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); moveQuestion(qi, "up"); }}
                  disabled={qi === 0}
                >
                  <ArrowUp size={14} />
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); moveQuestion(qi, "down"); }}
                  disabled={qi === questions.length - 1}
                >
                  <ArrowDown size={14} />
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); removeQuestion(qi); }}
                  disabled={questions.length === 1}
                >
                  <Trash2 size={14} />
                </AdminButton>
              </div>
            </div>

            {/* Question body */}
            {expandedIdx === qi && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-200 p-4 space-y-4"
              >
                <AdminField label="Question Prompt">
                  <AdminTextarea
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qi, "prompt", e.target.value)}
                    rows={3}
                    placeholder="Enter the question text..."
                  />
                </AdminField>

                <AdminField label="Question Image (optional)">
                  <AdminImageUpload
                    label="Question Image"
                    value={q.imageUrl}
                    onChange={(url) => updateQuestion(qi, "imageUrl", url)}
                    purpose="exam-question-image"
                    aspect="video"
                  />
                </AdminField>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Answer Options <span className="text-slate-400">(click ✓ to mark correct)</span>
                  </label>
                  {q.options.map((opt, oi) => (
                    <div key={opt.localId} className={`flex items-center gap-3 rounded-lg p-2 border transition-colors ${opt.isCorrect ? "border-emerald-500/50 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                      <button
                        type="button"
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${opt.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"}`}
                        onClick={() => updateOption(qi, oi, "isCorrect", true)}
                        title="Mark as correct answer"
                      >
                        {opt.isCorrect && <Check size={12} />}
                      </button>
                      <AdminInput
                        value={opt.text}
                        onChange={(e) => updateOption(qi, oi, "text", e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1"
                      />
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(qi, oi)}
                        disabled={q.options.length <= 2}
                      >
                        <X size={13} />
                      </AdminButton>
                    </div>
                  ))}
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() => addOption(qi)}
                    disabled={q.options.length >= 6}
                    className="mt-1"
                  >
                    <Plus size={14} /> Add Option
                  </AdminButton>
                </div>

                <AdminField label="Explanation (shown after exam)">
                  <AdminTextarea
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
                    rows={2}
                    placeholder="Optional explanation for the correct answer..."
                  />
                </AdminField>
              </motion.div>
            )}
          </AdminCard>
        ))}
      </div>

      <AdminButton
        variant="ghost"
        onClick={addQuestion}
        className="w-full border-2 border-dashed border-slate-200 hover:border-accent py-4"
      >
        <Plus size={16} /> Add Question
      </AdminButton>

      {/* Floating save bar */}
      <div className="fixed bottom-6 right-6 z-50">
        <AdminButton
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          isLoading={saving}
          className="shadow-2xl shadow-accent/55"
        >
          {!saving && <Check size={16} />} Save {questions.length} Questions
        </AdminButton>
      </div>

      {ToastViewport}
    </div>
  );
}
