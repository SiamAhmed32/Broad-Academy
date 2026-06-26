"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { BrandLogo } from "@/components/Brand";

type RecoveryStep = "email" | "reset" | "success";
type FieldErrors = Record<string, string[] | undefined>;

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10";

export default function ForgotPasswordPage() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<RecoveryStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  async function requestOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "We could not send a code.");
        setFields(result.fields || {});
        return;
      }

      setMessage(result.message);
      setStep("reset");
    } catch {
      setMessage("We could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function resendOtp() {
    setResending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      setMessage(result.message || "Please wait before requesting another code.");
    } catch {
      setMessage("We could not resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: form.get("otp"),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "We could not reset your password.");
        setFields(result.fields || {});
        return;
      }

      setStep("success");
      setMessage(result.message);
    } catch {
      setMessage("We could not reach the server. Please try again.");
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
        className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_30px_100px_rgba(22,51,81,0.14)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[0.92fr_1.08fr]"
      >
        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between">
              <BrandLogo />
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-btnBg transition hover:bg-btnBg/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="mt-12"
                >
                  <RecoveryHeading
                    icon={<Mail className="h-5 w-5" />}
                    title="Forgot your password?"
                    description="Enter your account email and we’ll send a secure 6-digit verification code."
                  />

                  <form onSubmit={requestOtp} noValidate className="mt-8 space-y-5">
                    <Field label="Email address" error={fields.email?.[0]}>
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={inputClass}
                        aria-label="Email address"
                      />
                    </Field>
                    <StatusMessage message={message} />
                    <SubmitButton pending={pending} label="Send verification code" pendingLabel="Sending code..." />
                  </form>
                </motion.div>
              )}

              {step === "reset" && (
                <motion.div
                  key="reset"
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="mt-10"
                >
                  <RecoveryHeading
                    icon={<KeyRound className="h-5 w-5" />}
                    title="Check your email"
                    description={`Enter the code sent for ${maskEmail(email)}, then choose a new password.`}
                  />

                  <form onSubmit={resetPassword} noValidate className="mt-7 space-y-4">
                    <Field label="6-digit verification code" error={fields.otp?.[0]}>
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        className={`${inputClass} text-lg font-semibold tracking-[0.35em]`}
                        aria-label="6-digit verification code"
                      />
                    </Field>

                    <Field label="New password" error={fields.password?.[0]}>
                      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        onChange={(event) => setPassword(event.target.value)}
                        className={`${inputClass} pr-11`}
                        aria-label="New password"
                      />
                      <PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} />
                    </Field>

                    {password && (
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                        {passwordChecks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-2 text-xs ${
                              check.passed ? "text-accent" : "text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {check.label}
                          </div>
                        ))}
                      </div>
                    )}

                    <Field label="Confirm new password" error={fields.confirmPassword?.[0]}>
                      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="confirmPassword"
                        type={showConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat your new password"
                        className={`${inputClass} pr-11`}
                        aria-label="Confirm new password"
                      />
                      <PasswordToggle
                        visible={showConfirmation}
                        onClick={() => setShowConfirmation((value) => !value)}
                      />
                    </Field>

                    <StatusMessage message={message} />
                    <SubmitButton pending={pending} label="Reset password" pendingLabel="Resetting password..." />

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setMessage("");
                        }}
                        className="font-semibold text-slate-500 hover:text-navy"
                      >
                        Change email
                      </button>
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={resending}
                        className="font-semibold text-btnBg hover:underline disabled:opacity-50"
                      >
                        {resending ? "Resending..." : "Resend code"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-16 text-center"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10 text-accent">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-navy">
                    Password updated
                  </h1>
                  <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-500">{message}</p>
                  <Link
                    href="/login"
                    className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-btnBg px-7 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:-translate-y-0.5"
                  >
                    Log in with new password
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.18)_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-[6rem] bg-btnBg/35" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <ShieldCheck className="h-4 w-4 text-[#8cf0d0]" />
              Secure account recovery
            </span>
            <h2 className="mt-9 max-w-xl text-5xl font-semibold leading-[1.1] tracking-[-0.045em]">
              Back to learning in a few secure steps.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/65">
              Your verification code expires quickly, incorrect attempts are limited,
              and every existing session is signed out after a successful reset.
            </p>
          </div>
          <div className="relative rounded-3xl border border-white/12 bg-white/9 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-[#8cf0d0]">A small safety reminder</p>
            <p className="mt-3 leading-7 text-white/65">
              Broad Academy will never ask you to share your OTP or password by phone,
              message, or email.
            </p>
          </div>
        </section>
      </motion.div>
    </main>
  );
}

function RecoveryHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        {icon}
      </div>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 leading-7 text-slate-500">{description}</p>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-navy">{label}</span>
      <span className="relative block">{children}</span>
      {error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function StatusMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
    >
      {message}
    </motion.div>
  );
}

function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:bg-[#006fe8] disabled:cursor-not-allowed disabled:opacity-65"
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
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
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}
