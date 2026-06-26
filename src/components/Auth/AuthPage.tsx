"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { BrandLogo } from "@/components/Brand";

type AuthMode = "login" | "signup";
type FieldErrors = Record<string, string[] | undefined>;

const inputClass =
  "peer h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10";

export default function AuthPage({
  mode,
  nextPath = "/dashboard",
}: {
  mode: AuthMode;
  nextPath?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});

  const passwordChecks = useMemo(
    () => [
      { label: "8+ characters", passed: password.length >= 8 },
      { label: "Uppercase", passed: /[A-Z]/.test(password) },
      { label: "Lowercase", passed: /[a-z]/.test(password) },
      { label: "Number", passed: /\d/.test(password) },
    ],
    [password],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    const form = new FormData(event.currentTarget);
    const payload = isSignup
      ? {
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword"),
          acceptedTerms: form.get("acceptedTerms") === "on",
        }
      : {
          email: form.get("email"),
          password: form.get("password"),
          rememberMe: form.get("rememberMe") === "on",
        };

    try {
      const response = await fetch(
        isSignup ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Something went wrong. Please try again.");
        setFields(result.fields || {});
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fb] p-3 sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-btnBg/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[90rem] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_30px_100px_rgba(22,51,81,0.14)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[0.9fr_1.1fr]"
      >
        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between">
              <BrandLogo />
              <Link
                href={`${isSignup ? "/login" : "/register"}?next=${encodeURIComponent(nextPath)}`}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-btnBg transition hover:bg-btnBg/5"
              >
                {isSignup ? "Log in" : "Create account"}
              </Link>
            </div>

            <motion.div
              key={mode}
              initial={reduceMotion ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="mt-9 sm:mt-12"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/8 px-3 py-1.5 text-xs font-semibold text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure student access
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
                {isSignup ? "Start your learning journey" : "Welcome back"}
              </h1>
              <p className="mt-3 leading-7 text-slate-500">
                {isSignup
                  ? "Create your student account and keep your courses, progress, and mentorship in one place."
                  : "Sign in to continue learning, review your progress, and connect with your mentors."}
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
              {isSignup && (
                <Field
                  id="fullName"
                  label="Full name"
                  icon={<UserRound />}
                  error={fields.fullName?.[0]}
                >
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    className={inputClass}
                    aria-invalid={Boolean(fields.fullName)}
                  />
                </Field>
              )}

              <Field
                id="email"
                label="Email address"
                icon={<Mail />}
                error={fields.email?.[0]}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                  aria-invalid={Boolean(fields.email)}
                />
              </Field>

              {isSignup && (
                <Field
                  id="phone"
                  label="Phone number"
                  icon={<Phone />}
                  error={fields.phone?.[0]}
                >
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    className={inputClass}
                    required
                    aria-invalid={Boolean(fields.phone)}
                  />
                </Field>
              )}

              <Field
                id="password"
                label="Password"
                icon={<LockKeyhole />}
                error={fields.password?.[0]}
              >
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClass} pr-11`}
                    aria-invalid={Boolean(fields.password)}
                  />
                  <PasswordToggle
                    visible={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  />
                </div>
              </Field>

              {isSignup && password && (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-2 text-xs ${
                        check.passed ? "text-accent" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${
                          check.passed ? "bg-accent text-white" : "bg-slate-200"
                        }`}
                      >
                        {check.passed && <Check className="h-2.5 w-2.5" />}
                      </span>
                      {check.label}
                    </div>
                  ))}
                </div>
              )}

              {isSignup && (
                <Field
                  id="confirmPassword"
                  label="Confirm password"
                  icon={<LockKeyhole />}
                  error={fields.confirmPassword?.[0]}
                >
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmation ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      className={`${inputClass} pr-11`}
                      aria-invalid={Boolean(fields.confirmPassword)}
                    />
                    <PasswordToggle
                      visible={showConfirmation}
                      onClick={() => setShowConfirmation((value) => !value)}
                    />
                  </div>
                </Field>
              )}

              {isSignup ? (
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-500">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#007bff]"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms-and-conditions" className="font-semibold text-navy hover:text-btnBg">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="font-semibold text-navy hover:text-btnBg">
                      Privacy Policy
                    </Link>
                    .
                    {fields.acceptedTerms?.[0] && (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {fields.acceptedTerms[0]}
                      </span>
                    )}
                  </span>
                </label>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      className="h-4 w-4 rounded border-slate-300 accent-[#007bff]"
                    />
                    Keep me signed in
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-btnBg hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {message}
                </motion.div>
              )}

              <motion.button
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                type="submit"
                disabled={pending}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:bg-[#006fe8] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-65"
              >
                {pending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {isSignup ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    {isSignup ? "Create student account" : "Sign In"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isSignup ? "Already have an account?" : "New to Broad Academy?"}{" "}
              <Link
                href={`${isSignup ? "/login" : "/register"}?next=${encodeURIComponent(nextPath)}`}
                className="font-semibold text-btnBg hover:underline"
              >
                {isSignup ? "Log in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>

        <AuthVisual mode={mode} reduceMotion={Boolean(reduceMotion)} />
      </motion.div>
    </main>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-navy">
          {label}
        </label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4.5 [&>svg]:w-4.5">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function PasswordToggle({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function AuthVisual({
  mode,
  reduceMotion,
}: {
  mode: AuthMode;
  reduceMotion: boolean;
}) {
  return (
    <section className="relative hidden min-h-full overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.18)_1px,transparent_0)] [background-size:28px_28px]" />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -18, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-20 -top-20 h-72 w-72 rounded-[5rem] bg-btnBg/35 blur-sm"
      />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 16, 0], x: [0, -8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-accent/25"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-[#70ddbd]" />
          Learn today. Lead tomorrow.
        </span>
        <h2 className="mt-8 max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] xl:text-5xl">
          {mode === "signup"
            ? "One account for every step of your academic growth."
            : "Your learning space is ready when you are."}
        </h2>
        <p className="mt-5 max-w-lg text-base leading-8 text-white/65">
          Access focused lessons, track meaningful progress, practice with quizzes,
          and receive guidance from teachers who care about your success.
        </p>
      </div>

      <div className="relative grid gap-4 xl:grid-cols-2">
        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl border border-white/12 bg-white/9 p-5 backdrop-blur-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#70ddbd] text-navy">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <p className="mt-5 text-lg font-semibold">Learn with direction</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Structured courses, guided practice, and visible progress.
          </p>
        </motion.article>
        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-3xl border border-white/12 bg-white/9 p-5 backdrop-blur-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-btnBg text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-5 text-lg font-semibold">Built for trust</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Protected credentials and revocable, server-managed sessions.
          </p>
        </motion.article>
      </div>
    </section>
  );
}
