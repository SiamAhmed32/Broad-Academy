"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  Clock3,
  FileQuestion,
  Loader2,
  Lock,
  Sparkles,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";

import Container from "@/components/reusables/Container";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cloudinaryCoverImage } from "@/lib/media/images";
import { cn } from "@/lib/utils";

type ExamAttempt = {
  id: string;
  score: number;
  total: number;
  correctQty: number;
  wrongQty: number;
  skippedQty: number;
  timeTakenSec: number;
  submittedAt: string;
};

type ExamLobbyData = {
  exam: {
    id: string;
    slug: string;
    title: string;
    code: string | null;
    description: string | null;
    bannerUrl: string | null;
    price: number;
    originalPrice: number | null;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: number;
    startsAt: string;
    endsAt: string;
    _count: { questions: number };
  };
  authenticated: boolean;
  hasAccess: boolean;
  enrollmentStatus: string | null;
  request: {
    id: string;
    status: string;
    submittedAt: string;
    reviewNote: string | null;
  } | null;
  attempts: ExamAttempt[];
  bkashNumber: string | null;
  paymentConfigured: boolean;
  profilePhone?: string | null;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function getExamState(exam: ExamLobbyData["exam"]) {
  const now = new Date();
  if (now < new Date(exam.startsAt)) return "upcoming";
  if (now > new Date(exam.endsAt)) return "ended";
  return "live";
}

function Pill({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-bold",
        accent
          ? "border-[#8cf0d0]/30 bg-[#8cf0d0]/12 text-[#8cf0d0]"
          : "border-white/15 bg-white/8 text-white/78",
      )}
    >
      {children}
    </span>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 sm:block sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-heroBg text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <div className="sm:mt-4">
        <strong className="block text-sm font-bold text-navy">{value}</strong>
        <span className="mt-0.5 block text-xs text-navy/42">{label}</span>
      </div>
    </div>
  );
}

function AnimatedSection({
  children,
  reduceMotion,
  className = "",
}: {
  children: React.ReactNode;
  reduceMotion: boolean | null;
  className?: string;
}) {
  return (
    <motion.section
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "rounded-[1.8rem] border border-navy/10 bg-white shadow-[0_14px_45px_rgba(22,51,81,.06)]",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
      {children}
    </p>
  );
}

function PaymentModal({
  open,
  exam,
  bkashNumber,
  onClose,
  onSuccess,
}: {
  open: boolean;
  exam: ExamLobbyData["exam"];
  bkashNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    studentPhone: "",
    guardianPhone: "",
    bkashSenderNumber: "",
    bkashTransactionId: "",
    classLevel: "",
    studentNote: "",
  });
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const inputClass =
    "h-11 w-full rounded-xl border border-navy/10 bg-heroBg px-3.5 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-50";

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Payment screenshot must be a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Payment screenshot must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setError("");
    setProof(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proof) {
      setError("Upload your bKash payment screenshot.");
      return;
    }
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    fd.append("paymentProof", proof);

    const res = await fetch(`/api/exams/${exam.slug}/checkout`, {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (json.success) {
      onSuccess();
    } else {
      setError(json.message ?? "Submission failed.");
      if (json.fields) setFieldErrors(json.fields);
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Send <strong className="text-navy">BDT {exam.price}</strong> to bKash{" "}
            <strong className="font-mono text-accent">{bkashNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-navy">Your Phone</span>
              <input
                className={inputClass}
                placeholder="01XXXXXXXXX"
                value={form.studentPhone}
                disabled={submitting}
                onChange={(e) => setForm((p) => ({ ...p, studentPhone: e.target.value }))}
              />
              {fieldErrors.studentPhone ? (
                <span className="text-xs text-red-600">{fieldErrors.studentPhone[0]}</span>
              ) : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-navy">Guardian Phone</span>
              <input
                className={inputClass}
                placeholder="01XXXXXXXXX"
                value={form.guardianPhone}
                disabled={submitting}
                onChange={(e) => setForm((p) => ({ ...p, guardianPhone: e.target.value }))}
              />
              {fieldErrors.guardianPhone ? (
                <span className="text-xs text-red-600">{fieldErrors.guardianPhone[0]}</span>
              ) : null}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-navy">bKash Sender Number</span>
              <input
                className={inputClass}
                placeholder="01XXXXXXXXX"
                value={form.bkashSenderNumber}
                disabled={submitting}
                onChange={(e) => setForm((p) => ({ ...p, bkashSenderNumber: e.target.value }))}
              />
              {fieldErrors.bkashSenderNumber ? (
                <span className="text-xs text-red-600">{fieldErrors.bkashSenderNumber[0]}</span>
              ) : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-navy">Transaction ID</span>
              <input
                className={cn(inputClass, "font-mono uppercase")}
                placeholder="8RABXXXXXX"
                value={form.bkashTransactionId}
                disabled={submitting}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bkashTransactionId: e.target.value.toUpperCase() }))
                }
              />
              {fieldErrors.bkashTransactionId ? (
                <span className="text-xs text-red-600">{fieldErrors.bkashTransactionId[0]}</span>
              ) : null}
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-navy">Class (1-12)</span>
            <input
              type="number"
              className={inputClass}
              placeholder="e.g. 10"
              min={1}
              max={12}
              value={form.classLevel}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, classLevel: e.target.value }))}
            />
            {fieldErrors.classLevel ? (
              <span className="text-xs text-red-600">{fieldErrors.classLevel[0]}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-navy">Payment Screenshot</span>
            <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-navy/15 bg-heroBg transition hover:border-accent/50">
              {proofPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofPreview} alt="Payment proof" className="h-full w-full object-contain" />
              ) : (
                <>
                  <Upload size={24} className="text-accent" />
                  <span className="text-sm font-semibold text-navy">Click to upload screenshot</span>
                  <span className="text-xs text-navy/45">JPG, PNG, WebP — Max 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                disabled={submitting}
                className="sr-only"
              />
            </label>
            {fieldErrors.paymentProof ? (
              <span className="text-xs text-red-600">{fieldErrors.paymentProof[0]}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-navy">Note (optional)</span>
            <textarea
              className={cn(inputClass, "min-h-20 resize-none py-2.5")}
              placeholder="Any note for the admin..."
              rows={2}
              value={form.studentNote}
              disabled={submitting}
              onChange={(e) => setForm((p) => ({ ...p, studentNote: e.target.value }))}
            />
          </label>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {submitting ? "Uploading proof..." : "Submit Payment Proof"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExamActionPanel({
  data,
  exam,
  slug,
  isFree,
  examState,
  canTake,
  hasPendingRequest,
  hasRejectedRequest,
  submitted,
  onStart,
  onPay,
}: {
  data: ExamLobbyData;
  exam: ExamLobbyData["exam"];
  slug: string;
  isFree: boolean;
  examState: string;
  canTake: boolean;
  hasPendingRequest: boolean;
  hasRejectedRequest: boolean;
  submitted: boolean;
  onStart: () => void;
  onPay: () => void;
}) {
  const discount =
    exam.originalPrice && exam.originalPrice > exam.price
      ? Math.round((1 - exam.price / exam.originalPrice) * 100)
      : null;

  return (
    <>
      {!isFree && discount ? (
        <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
          Save {discount}%
        </span>
      ) : null}

      <div className="mt-4">
        {isFree ? (
          <>
            <span className="text-3xl font-bold tracking-[-0.05em] text-accent">Free</span>
            <p className="mt-1 text-sm text-navy/45">Open to all registered students</p>
          </>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-[-0.05em] text-navy">
              ৳{exam.price.toLocaleString("en-US")}
            </span>
            {exam.originalPrice ? (
              <span className="text-base text-navy/35 line-through">
                ৳{exam.originalPrice.toLocaleString("en-US")}
              </span>
            ) : null}
          </div>
        )}
        {!isFree ? (
          <p className="mt-1 text-xs text-navy/45">Pay via bKash · verified within 24 hours</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {data.hasAccess ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <Check size={15} className="shrink-0" />
            You have access to this exam
          </div>
        ) : null}

        {hasPendingRequest ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Loader2 size={15} className="shrink-0 animate-spin" />
            Payment submitted — awaiting verification
          </div>
        ) : null}

        {hasRejectedRequest ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <p className="font-medium">Payment rejected</p>
            {data.request?.reviewNote ? (
              <p className="mt-1 text-xs">{data.request.reviewNote}</p>
            ) : null}
          </div>
        ) : null}

        {submitted && !data.hasAccess && !hasPendingRequest ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            <Check size={15} className="shrink-0" />
            Payment submitted! We&apos;ll verify within 24 hours.
          </div>
        ) : null}

        {canTake ? (
          <Button id="exam-start-btn" size="lg" className="w-full" onClick={onStart}>
            <Zap size={18} />
            Start Exam
          </Button>
        ) : !data.authenticated ? (
          <Button id="exam-login-btn" size="lg" className="w-full" onClick={onStart}>
            <Lock size={18} />
            Log in to {isFree ? "Take Exam" : "Register"}
          </Button>
        ) : !isFree && !data.hasAccess && !hasPendingRequest ? (
          <Button id="exam-pay-btn" size="lg" className="w-full" onClick={onPay}>
            <Upload size={18} />
            Submit Payment Proof
          </Button>
        ) : examState === "upcoming" ? (
          <div className="rounded-xl bg-heroBg px-4 py-3 text-center text-sm text-navy/60">
            This exam is not open yet.
          </div>
        ) : examState === "ended" ? (
          <div className="rounded-xl bg-heroBg px-4 py-3 text-center text-sm text-navy/60">
            This exam has ended.
          </div>
        ) : null}
      </div>

      <div className="my-6 h-px bg-navy/8" />

      <Link
        href={`/exams/${slug}/leaderboard`}
        className="flex items-center justify-between rounded-xl border border-navy/8 bg-heroBg px-4 py-3 text-sm font-semibold text-navy transition hover:border-accent/25 hover:bg-white"
      >
        <span className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          View Leaderboard
        </span>
        <ChevronRight size={14} className="text-navy/35" />
      </Link>

      <div className="mt-5 space-y-3">
        <p className="text-sm font-bold text-navy">This exam includes</p>
        {[
          `${exam._count.questions} MCQ questions`,
          `${exam.durationMinutes} minutes duration`,
          `${exam.totalMarks} total marks`,
          exam.negativeMarking > 0
            ? `${exam.negativeMarking} negative marking per wrong`
            : "No negative marking",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-navy/60">
            <Check size={14} className="shrink-0 text-accent" />
            {item}
          </div>
        ))}
      </div>
    </>
  );
}

export default function ExamLobbyClient({ slug }: { slug: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<ExamLobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadExamLobby = useCallback(async () => {
    const res = await fetch(`/api/exams/${slug}`, { cache: "no-store" });
    const json = await res.json();
    if (json.success) {
      setData(json.data);
      if (json.data.hasAccess) setSubmitted(false);
    }
    return json;
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    void loadExamLobby().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [loadExamLobby]);

  useEffect(() => {
    if (!data?.authenticated || data.hasAccess) return;

    const waitingForApproval = data.request?.status === "PENDING";
    const pollMs = waitingForApproval ? 12_000 : 30_000;

    function refreshIfVisible() {
      if (document.visibilityState !== "visible") return;
      void loadExamLobby();
    }

    const intervalId = window.setInterval(refreshIfVisible, pollMs);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("exam-access-changed", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("exam-access-changed", refreshIfVisible);
    };
  }, [data?.authenticated, data?.hasAccess, data?.request?.status, loadExamLobby]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb] px-4">
        <div className="max-w-md rounded-[1.8rem] border border-navy/10 bg-white p-8 text-center shadow-[0_14px_45px_rgba(22,51,81,.06)]">
          <FileQuestion size={48} className="mx-auto mb-4 text-navy/20" />
          <h2 className="text-xl font-semibold text-navy">Exam not found</h2>
          <Link
            href="/exams"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent"
          >
            <ArrowLeft size={14} /> Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  const { exam } = data;
  const examState = getExamState(exam);
  const isFree = exam.price === 0;
  const bannerSrc = exam.bannerUrl
    ? cloudinaryCoverImage(exam.bannerUrl, 960, 540)
    : null;

  function handleStartExam() {
    if (!data?.authenticated) {
      router.push(`/login?next=/exams/${slug}`);
      return;
    }
    router.push(`/exams/${slug}/take`);
  }

  function handlePayment() {
    if (!data?.authenticated) {
      router.push(`/login?next=/exams/${slug}`);
      return;
    }
    setPaymentModal(true);
  }

  function onPaymentSuccess() {
    setPaymentModal(false);
    setSubmitted(true);
    void loadExamLobby();
  }

  const canTake = data.hasAccess && examState === "live";
  const hasPendingRequest =
    !data.hasAccess && data.request?.status === "PENDING";
  const hasRejectedRequest =
    !data.hasAccess && data.request?.status === "REJECTED";

  const actionProps = {
    data,
    exam,
    slug,
    isFree,
    examState,
    canTake,
    hasPendingRequest,
    hasRejectedRequest,
    submitted,
    onStart: handleStartExam,
    onPay: handlePayment,
  };

  return (
    <main className="overflow-hidden bg-[#f6f8fb] pb-24 lg:pb-0">
      <section className="relative bg-navy pb-28 pt-7 text-white sm:pb-32 sm:pt-10 lg:pb-40">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.22)_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="absolute -right-20 top-8 h-80 w-80 rounded-full bg-btnBg/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <Container className="relative">
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All exams
          </Link>

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-10 max-w-3xl"
          >
            <div className="flex flex-wrap gap-2">
              <Pill accent>
                <Sparkles className="mr-1 inline h-3 w-3" />
                MCQ Exam
              </Pill>
              {isFree ? (
                <Pill accent>Free competition</Pill>
              ) : (
                <Pill>Premium exam</Pill>
              )}
              {examState === "live" ? (
                <Pill accent>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#8cf0d0]" />
                  Available now
                </Pill>
              ) : examState === "upcoming" ? (
                <Pill>Coming soon</Pill>
              ) : (
                <Pill>Ended</Pill>
              )}
              {exam.code ? <Pill>{exam.code}</Pill> : null}
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {exam.title}
            </h1>

            {exam.description ? (
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg line-clamp-3">
                {exam.description}
              </p>
            ) : (
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
                Test your knowledge, track your score, and compete on the leaderboard.
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/72">
              <span className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-[#8cf0d0]" />
                <strong className="text-white">{exam._count.questions}</strong> questions
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#8cf0d0]" />
                {exam.durationMinutes} minutes
              </span>
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#8cf0d0]" />
                {exam.totalMarks} marks
              </span>
            </div>
          </motion.div>
        </Container>
      </section>

      <Container className="relative -mt-20 pb-20 lg:-mt-28">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px] xl:gap-10">
          <div className="space-y-7">
            <AnimatedSection reduceMotion={reduceMotion} className="p-0">
              <div className="grid gap-px overflow-hidden rounded-[1.8rem] bg-navy/8 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  icon={FileQuestion}
                  value={`${exam._count.questions}`}
                  label="Questions"
                />
                <Metric
                  icon={Clock3}
                  value={`${exam.durationMinutes} min`}
                  label="Duration"
                />
                <Metric
                  icon={Award}
                  value={`${exam.totalMarks}`}
                  label="Total marks"
                />
                <Metric
                  icon={AlertCircle}
                  value={exam.negativeMarking > 0 ? `-${exam.negativeMarking}` : "None"}
                  label="Negative marking"
                />
              </div>
            </AnimatedSection>

            {exam.description ? (
              <AnimatedSection reduceMotion={reduceMotion} className="p-6 sm:p-8">
                <Eyebrow>About this exam</Eyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-3xl">
                  What to expect
                </h2>
                <p className="mt-5 text-sm leading-7 text-navy/65 sm:text-base">
                  {exam.description}
                </p>
              </AnimatedSection>
            ) : null}

            {data.attempts.length > 0 ? (
              <AnimatedSection reduceMotion={reduceMotion} className="p-6 sm:p-8">
                <Eyebrow>Your history</Eyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-3xl">
                  Previous attempts
                </h2>
                <div className="mt-6 space-y-3">
                  {data.attempts.map((attempt, i) => (
                    <Link
                      key={attempt.id}
                      href={`/exams/${slug}/result/${attempt.id}`}
                      className="group flex items-center justify-between rounded-2xl border border-navy/8 bg-[#fafcfe] p-4 transition hover:border-accent/25 hover:bg-white"
                    >
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          Attempt #{data.attempts.length - i}
                        </p>
                        <p className="mt-0.5 text-xs text-navy/45">
                          {new Date(attempt.submittedAt).toLocaleString("en-BD")} ·{" "}
                          {formatTime(attempt.timeTakenSec)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent">
                            {attempt.score}/{attempt.total}
                          </p>
                          <p className="text-xs text-navy/45">
                            ✓{attempt.correctQty} ✗{attempt.wrongQty} –{attempt.skippedQty}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-navy/30 transition group-hover:text-accent"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </AnimatedSection>
            ) : null}
          </div>

          <motion.aside
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="hidden overflow-hidden rounded-[1.8rem] border border-navy/10 bg-white shadow-[0_24px_70px_rgba(22,51,81,.16)] lg:sticky lg:top-24 lg:block"
          >
            <div className="relative aspect-video overflow-hidden bg-navy">
              {bannerSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerSrc}
                    alt={exam.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-navy/22" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#0f2740] to-navy" />
              )}
              <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-accent shadow-xl">
                <Zap className="h-6 w-6" />
              </span>
            </div>
            <div className="p-6">
              <ExamActionPanel {...actionProps} />
            </div>
          </motion.aside>
        </div>
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white/95 p-3 shadow-[0_-10px_35px_rgba(22,51,81,.12)] backdrop-blur lg:hidden">
        <Container className="flex items-center justify-between gap-4 px-1 sm:px-4">
          <div>
            {isFree ? (
              <>
                <span className="block text-xs text-navy/45">Entry</span>
                <strong className="text-xl text-accent">Free</strong>
              </>
            ) : (
              <>
                <span className="block text-xs text-navy/45">Exam fee</span>
                <strong className="text-xl text-navy">
                  ৳{exam.price.toLocaleString("en-US")}
                </strong>
              </>
            )}
          </div>
          {canTake ? (
            <Button id="exam-start-btn-mobile" onClick={handleStartExam}>
              Start Exam
            </Button>
          ) : !data.authenticated ? (
            <Button id="exam-login-btn-mobile" onClick={handleStartExam}>
              Log in
            </Button>
          ) : !isFree && !data.hasAccess && !hasPendingRequest ? (
            <Button id="exam-pay-btn-mobile" onClick={handlePayment}>
              Pay &amp; Register
            </Button>
          ) : hasPendingRequest ? (
            <span className="text-xs font-semibold text-amber-700">Awaiting verification</span>
          ) : null}
        </Container>
      </div>

      {paymentModal && data.bkashNumber ? (
        <PaymentModal
          open={paymentModal}
          exam={exam}
          bkashNumber={data.bkashNumber}
          onClose={() => setPaymentModal(false)}
          onSuccess={onPaymentSuccess}
        />
      ) : null}
    </main>
  );
}
