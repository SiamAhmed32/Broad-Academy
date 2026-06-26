"use client";

import { motion } from "framer-motion";
import {
  Target,
  Clock,
  Users,
  BookOpen,
  Star,
  MessageCircle,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { useState } from "react";

import BookingModal from "./BookingModal";
import CounsellingProcessVideoModal from "./CounsellingProcessVideoModal";

// ─── Animation variants ───

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Data ───

const benefits = [
  {
    icon: Target,
    title: "Clear Guidance for Parents",
    desc: "Understand your child’s current level, study gaps, and the next best academic step.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Clock,
    title: "Save Family Time",
    desc: "Skip the confusion — find the right course in just one session with our expert advisor.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "Guardian-Friendly Advisors",
    desc: "Talk with advisors who explain options simply and focus on your child’s progress.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BookOpen,
    title: "Right Course Match",
    desc: "Find courses aligned with your child’s class, syllabus, routine, and exam preparation needs.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const steps = [
  {
    step: "01",
    title: "Parent Sends a Request",
    desc: "Share your contact details, your child’s class, subject need, and preferred time.",
  },
  {
    step: "02",
    title: "Talk With an Advisor",
    desc: "Discuss your child’s study habits, weak areas, goals, and the support you expect.",
  },
  {
    step: "03",
    title: "Get a Parent-Friendly Plan",
    desc: "Receive a practical course recommendation and study direction you can confidently follow.",
  },
];

const faqs = [
  {
    q: "How much does a counselling session cost?",
    a: "Counselling is a paid parent-support service. After you submit a request, our team contacts you to confirm availability and share the session fee before anything is finalised.",
  },
  {
    q: "How long does a session take?",
    a: "A typical session lasts 20–30 minutes, enough time to understand your child’s needs and recommend the best path forward.",
  },
  {
    q: "Who should book this session?",
    a: "This counselling service is mainly for parents or guardians. Please provide your own contact details and your child’s class/subject information in the form.",
  },
  {
    q: "What happens after I book?",
    a: "You'll receive a confirmation email. Our advisor will reach out before your session to confirm the time and ask any preliminary questions.",
  },
];

const testimonials = [
  {
    name: "Tania A.",
    role: "Class 8 Parent",
    text: "I was confused about which course would actually help my daughter. The advisor explained everything clearly and patiently.",
    rating: 5,
  },
  {
    name: "Rafiq H.",
    role: "SSC Guardian",
    text: "The session helped us understand our son’s weak areas and choose a study plan that felt realistic for our family.",
    rating: 5,
  },
  {
    name: "Nusrat J.",
    role: "HSC Parent",
    text: "We needed honest guidance before enrolling. The counselling call gave us a clear direction and removed a lot of stress.",
    rating: 5,
  },
];

// ─── Component ───

export default function CounsellingPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessVideoOpen, setIsProcessVideoOpen] = useState(false);

  return (
    <div className="overflow-hidden">
      {/* ─── Hero Section ─── */}
      <section className="relative bg-linear-to-br from-navy via-[#1a3d5e] to-[#0d2840] text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-20 left-10 h-72 w-72 bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-20 h-64 w-64 bg-blue-500/15 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Parent guidance for your child’s academic path
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              Help Your Child Choose the{" "}
              <span className="bg-linear-to-r from-accent to-emerald-300 bg-clip-text text-transparent">
                Right Academic Path
              </span>{" "}
              with Confidence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-white/70 leading-relaxed"
            >
              A counselling session built mainly for parents and guardians.
              Talk with our academic advisors, understand your child&apos;s needs,
              choose the right course, and confirm session fees before you commit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-2.5 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent/90 cursor-pointer"
              >
                <CalendarCheck className="h-5 w-5" />
                Request Parent Counselling
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setIsProcessVideoOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/10 cursor-pointer"
              >
                <PlayCircle className="h-5 w-5 text-accent" />
                Watch Parent Guide
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/50"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Parent/guardian focused
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Child study plan support
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                20-Minute Sessions
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Benefits Section ─── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold tracking-wide text-accent uppercase"
            >
              Why Choose Us
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 text-2xl font-bold text-navy sm:text-4xl"
            >
              Why parents choose counselling
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-4 max-w-2xl text-gray-500 leading-relaxed"
            >
              Parents should not have to guess which course, teacher, or routine
              is right. Our counselling helps families make that decision clearly.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${b.color} transition-transform group-hover:scale-110`}
                >
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy">{b.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="bg-gray-50/80 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold tracking-wide text-accent uppercase"
            >
              Simple Process
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 text-2xl font-bold text-navy sm:text-4xl"
            >
              How It Works
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp}
                custom={i}
                className="relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="absolute -top-5 left-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-lg shadow-accent/30">
                    {s.step}
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block">
                    <ChevronRight className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold tracking-wide text-accent uppercase"
            >
              Parent Stories
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 text-2xl font-bold text-navy sm:text-4xl"
            >
              What Parents Say
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mt-16 grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section className="bg-gray-50/80 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold tracking-wide text-accent uppercase"
            >
              FAQ
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 text-2xl font-bold text-navy sm:text-4xl"
            >
              Frequently Asked Questions
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mt-12 space-y-4"
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} index={i} question={faq.q} answer={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative bg-navy py-20 sm:py-28 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-80 w-80 bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 bg-blue-500/15 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <MessageCircle className="mx-auto h-12 w-12 text-accent" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-6 text-2xl font-bold text-white sm:text-4xl"
            >
              Ready to Talk About Your Child’s Study Plan?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-4 max-w-xl text-white/60 leading-relaxed"
            >
              If you are unsure which course or support path is right, book a
              parent counselling session and get clear academic direction first.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsModalOpen(true)}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-accent px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent/90 cursor-pointer"
              >
                <CalendarCheck className="h-5 w-5" />
                Request parent counselling
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Booking Modal ─── */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <CounsellingProcessVideoModal
        open={isProcessVideoOpen}
        onClose={() => setIsProcessVideoOpen(false)}
        onBook={() => setIsModalOpen(true)}
      />
    </div>
  );
}

// ─── FAQ Accordion Item ───

function FAQItem({
  index,
  question,
  answer,
}: {
  index: number;
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
      >
        <span className="text-sm font-semibold text-navy sm:text-base">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
}
