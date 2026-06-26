"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileQuestion,
  Lock,
  Loader2,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react";

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

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-indigo-400">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

// Payment form modal
function PaymentModal({
  exam,
  bkashNumber,
  onClose,
  onSuccess,
}: {
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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProof(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proof) { setError("Upload your bKash payment screenshot."); return; }
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Complete Payment</h2>
        <p className="text-slate-400 text-sm mb-5">
          Send <strong className="text-white">৳{exam.price}</strong> to bKash:{" "}
          <strong className="text-emerald-400 font-mono text-base">{bkashNumber}</strong>
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 rounded-lg p-3 text-sm text-red-300 mb-4 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Your Phone</label>
              <input
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none"
                placeholder="01XXXXXXXXX"
                value={form.studentPhone}
                onChange={(e) => setForm((p) => ({ ...p, studentPhone: e.target.value }))}
              />
              {fieldErrors.studentPhone && <p className="text-red-400 text-xs mt-1">{fieldErrors.studentPhone[0]}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Guardian Phone</label>
              <input
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none"
                placeholder="01XXXXXXXXX"
                value={form.guardianPhone}
                onChange={(e) => setForm((p) => ({ ...p, guardianPhone: e.target.value }))}
              />
              {fieldErrors.guardianPhone && <p className="text-red-400 text-xs mt-1">{fieldErrors.guardianPhone[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">bKash Sender Number</label>
              <input
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none"
                placeholder="01XXXXXXXXX"
                value={form.bkashSenderNumber}
                onChange={(e) => setForm((p) => ({ ...p, bkashSenderNumber: e.target.value }))}
              />
              {fieldErrors.bkashSenderNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.bkashSenderNumber[0]}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Transaction ID</label>
              <input
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 font-mono focus:border-indigo-500 outline-none uppercase"
                placeholder="8RABXXXXXX"
                value={form.bkashTransactionId}
                onChange={(e) => setForm((p) => ({ ...p, bkashTransactionId: e.target.value.toUpperCase() }))}
              />
              {fieldErrors.bkashTransactionId && <p className="text-red-400 text-xs mt-1">{fieldErrors.bkashTransactionId[0]}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Class (1-12)</label>
            <input
              type="number"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none"
              placeholder="e.g. 10"
              min={1}
              max={12}
              value={form.classLevel}
              onChange={(e) => setForm((p) => ({ ...p, classLevel: e.target.value }))}
            />
            {fieldErrors.classLevel && <p className="text-red-400 text-xs mt-1">{fieldErrors.classLevel[0]}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Payment Screenshot</label>
            <label className="flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed border-white/20 hover:border-indigo-500/50 cursor-pointer transition-colors bg-white/3 overflow-hidden">
              {proofPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofPreview} alt="Payment proof" className="w-full h-full object-contain" />
              ) : (
                <>
                  <Upload size={24} className="text-slate-500" />
                  <span className="text-sm text-slate-500">Click to upload screenshot</span>
                  <span className="text-xs text-slate-600">JPG, PNG, WebP · Max 5MB</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="sr-only" />
            </label>
            {fieldErrors.paymentProof && <p className="text-red-400 text-xs mt-1">{fieldErrors.paymentProof[0]}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Note (optional)</label>
            <textarea
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none resize-none"
              placeholder="Any note for the admin..."
              rows={2}
              value={form.studentNote}
              onChange={(e) => setForm((p) => ({ ...p, studentNote: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {submitting ? "Submitting..." : "Submit Payment Proof"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ExamLobbyClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [data, setData] = useState<ExamLobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/exams/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <FileQuestion size={48} className="mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold mb-2">Exam not found</h2>
          <Link href="/exams" className="text-indigo-400 hover:text-indigo-300">← Back to Exams</Link>
        </div>
      </div>
    );
  }

  const { exam } = data;
  const examState = getExamState(exam);
  const isFree = exam.price === 0;

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
    // Refresh data
    fetch(`/api/exams/${slug}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); });
  }

  const canTake = data.hasAccess && examState === "live";
  const hasPendingRequest = data.request?.status === "PENDING";
  const hasRejectedRequest = data.request?.status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950" />
        {exam.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exam.bannerUrl} alt={exam.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="relative h-full flex items-end max-w-7xl mx-auto px-4 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Link href="/exams" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                ← Exams
              </Link>
              {exam.code && <span className="text-xs text-slate-500 font-mono">/ {exam.code}</span>}
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              {isFree ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white">
                  <Zap size={11} className="inline mr-1" />FREE
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/90 text-white">
                  <Lock size={11} className="inline mr-1" />PAID — ৳{exam.price}
                </span>
              )}
              {examState === "live" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
                  Live Now
                </span>
              )}
              {examState === "upcoming" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Calendar size={11} className="inline mr-1" />Upcoming
                </span>
              )}
              {examState === "ended" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                  Ended
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{exam.title}</h1>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 pb-16 -mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox icon={<FileQuestion size={20} />} label="Questions" value={exam._count.questions} />
              <StatBox icon={<Clock size={20} />} label="Duration" value={`${exam.durationMinutes}m`} />
              <StatBox icon={<Award size={20} />} label="Total Marks" value={exam.totalMarks} />
              <StatBox icon={<X size={20} className="text-red-400" />} label="Negative" value={exam.negativeMarking > 0 ? `-${exam.negativeMarking}` : "None"} />
            </div>

            {/* Description */}
            {exam.description && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="font-bold text-white mb-3">About This Exam</h2>
                <p className="text-slate-300 leading-relaxed">{exam.description}</p>
              </div>
            )}

            {/* Previous attempts */}
            {data.attempts.length > 0 && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="font-bold text-white mb-4">Your Attempts</h2>
                <div className="space-y-3">
                  {data.attempts.map((attempt, i) => (
                    <Link
                      key={attempt.id}
                      href={`/exams/${slug}/result/${attempt.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-colors group"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Attempt #{data.attempts.length - i}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(attempt.submittedAt).toLocaleString("en-BD")} · {formatTime(attempt.timeTakenSec)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-indigo-400">{attempt.score}/{attempt.total}</div>
                          <div className="text-xs text-slate-500">
                            ✓{attempt.correctQty} ✗{attempt.wrongQty} –{attempt.skippedQty}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Access Card */}
          <div className="space-y-4">
            <div className="sticky top-24">
              <div className="rounded-2xl bg-gradient-to-b from-white/8 to-white/3 border border-white/15 p-6 space-y-5">
                <div className="text-center">
                  {isFree ? (
                    <div>
                      <div className="text-4xl font-extrabold text-emerald-400 mb-1">Free</div>
                      <div className="text-sm text-slate-400">Open to all registered students</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-extrabold text-white">৳{exam.price}</span>
                        {exam.originalPrice && (
                          <span className="text-lg text-slate-500 line-through">৳{exam.originalPrice}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Pay via bKash</div>
                    </div>
                  )}
                </div>

                {/* Access status */}
                {data.hasAccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <Check size={16} />
                    <span>You have access to this exam</span>
                  </div>
                )}

                {hasPendingRequest && (
                  <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Payment submitted — awaiting verification</span>
                  </div>
                )}

                {hasRejectedRequest && (
                  <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <X size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div>Payment rejected</div>
                      {data.request?.reviewNote && (
                        <div className="text-xs text-red-300 mt-1">{data.request.reviewNote}</div>
                      )}
                    </div>
                  </div>
                )}

                {submitted && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <Check size={16} />
                    <span>Payment submitted! We&apos;ll verify within 24 hours.</span>
                  </div>
                )}

                {/* CTA */}
                {canTake ? (
                  <button
                    id="exam-start-btn"
                    onClick={handleStartExam}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                  >
                    <Zap size={20} />
                    Start Exam
                  </button>
                ) : !data.authenticated ? (
                  <button
                    id="exam-login-btn"
                    onClick={handleStartExam}
                    className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Lock size={18} />
                    Log In to {isFree ? "Take Exam" : "Register"}
                  </button>
                ) : !isFree && !data.hasAccess && !hasPendingRequest ? (
                  <button
                    id="exam-pay-btn"
                    onClick={handlePayment}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    Submit Payment Proof
                  </button>
                ) : examState === "upcoming" ? (
                  <div className="text-center text-sm text-slate-400 bg-white/5 rounded-xl p-4">
                    <Calendar size={20} className="mx-auto mb-2 text-amber-400" />
                    This exam is not open yet.
                  </div>
                ) : examState === "ended" ? (
                  <div className="text-center text-sm text-slate-400 bg-white/5 rounded-xl p-4">
                    This exam has ended.
                    <Link href={`/exams/${slug}/leaderboard`} className="block mt-2 text-indigo-400 hover:text-indigo-300">
                      View Leaderboard →
                    </Link>
                  </div>
                ) : null}

                {/* Leaderboard link */}
                <Link
                  href={`/exams/${slug}/leaderboard`}
                  className="flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors p-3 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    View Leaderboard
                  </div>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {paymentModal && data.bkashNumber && (
        <PaymentModal
          exam={exam}
          bkashNumber={data.bkashNumber}
          onClose={() => setPaymentModal(false)}
          onSuccess={onPaymentSuccess}
        />
      )}
    </div>
  );
}
