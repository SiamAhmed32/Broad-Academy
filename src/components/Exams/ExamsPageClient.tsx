"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Clock,
  Award,
  Lock,
  Users,
  Zap,
  ChevronRight,
  Calendar,
  FileQuestion,
} from "lucide-react";

type Exam = {
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
  startsAt: string;
  endsAt: string;
};

type ExamsData = {
  freeExams: Exam[];
  paidExams: Exam[];
};

function ExamStatusBadge({ exam }: { exam: Exam }) {
  const now = new Date();
  const start = new Date(exam.startsAt);
  const end = new Date(exam.endsAt);

  if (now < start) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        <Calendar size={10} /> Upcoming
      </span>
    );
  }
  if (now > end) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
        Ended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live Now
    </span>
  );
}

function ExamCard({ exam, isFree }: { exam: Exam; isFree: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Link href={`/exams/${exam.slug}`} className="block h-full">
        <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-navy/10">
          {/* Banner */}
          <div className="relative h-44 overflow-hidden bg-navy">
            {exam.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={exam.bannerUrl} alt={exam.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileQuestion size={48} className="text-white/40" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <ExamStatusBadge exam={exam} />
              {isFree ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600/90 text-white border border-emerald-500/50">
                  <Zap size={10} /> FREE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600/90 text-white border border-indigo-500/50">
                  <Lock size={10} /> PAID
                </span>
              )}
            </div>
            {/* Code */}
            {exam.code && (
              <div className="absolute bottom-3 right-3 rounded bg-navy/80 px-2 py-1 font-mono text-xs text-white/80">
                {exam.code}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-navy text-lg leading-tight group-hover:text-accent transition-colors line-clamp-2">
              {exam.title}
            </h3>

            {exam.description && (
              <p className="text-slate-600 text-sm line-clamp-2">{exam.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={13} className="text-accent" />
                {exam.durationMinutes} minutes
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Award size={13} className="text-accent" />
                {exam.totalMarks} marks
              </div>
            </div>

            {/* Price / CTA */}
            <div className="flex items-center justify-between gap-4 pt-1">
              {isFree ? (
                <span className="text-lg font-bold text-accent">Free</span>
              ) : (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Course fee
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-navy">?{exam.price}</span>
                    {exam.originalPrice ? (
                      <span className="text-sm text-slate-400 line-through">
                        ?{exam.originalPrice}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-accent font-semibold group-hover:gap-2 transition-all">
                View Details <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ExamsPageClient({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [data, setData] = useState<ExamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"free" | "paid">("free");

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const freeExams = data?.freeExams ?? [];
  const paidExams = data?.paidExams ?? [];
  const activeExams = activeTab === "free" ? freeExams : paidExams;
  const examTabs = [
    {
      key: "free" as const,
      label: "Free Exams",
      description: "Open competitions",
      count: freeExams.length,
      icon: <Zap size={16} />,
    },
    {
      key: "paid" as const,
      label: "Premium Exams",
      description: "Verified paid access",
      count: paidExams.length,
      icon: <Lock size={16} />,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
              <Zap size={14} />
              Test Your Knowledge
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
              Exam
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> Arena</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Compete in live exam competitions. Test your knowledge, climb the leaderboard, and earn your rank.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="relative z-30 bg-white px-4">
        <div className="mx-auto max-w-5xl">
          <div className="-mt-9 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 sm:grid-cols-2">
            {examTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`exam-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group flex items-center justify-between gap-4 rounded-xl px-4 py-4 text-left transition-all ${
                    isActive
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-white/10 text-emerald-300"
                          : "bg-slate-100 text-slate-500 group-hover:text-navy"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{tab.label}</span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          isActive ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {tab.description}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      isActive
                        ? "bg-white text-slate-950"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exam grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 h-80 animate-pulse" />
            ))}
          </div>
        ) : activeExams.length === 0 ? (
          <div className="text-center py-24">
            <FileQuestion size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No {activeTab === "free" ? "free" : "premium"} exams available
            </h3>
            <p className="text-slate-600">Check back soon for new exam competitions!</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {activeExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} isFree={activeTab === "free"} />
            ))}
          </motion.div>
        )}

        {/* Login CTA for guests */}
        {!loading && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-violet-900/80" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(139,92,246,0.2),transparent)]" />
            <div className="relative p-8 sm:p-12 text-center">
              <Users size={32} className="mx-auto text-indigo-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">
                Sign in to Participate
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Create a free account to join exam competitions, track your scores, and compete on the leaderboard.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/login" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20">
                  Log In
                </Link>
                <Link href="/register" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

