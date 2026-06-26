"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MailCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BrandLogo } from "@/components/Brand";

type VerifyState = "idle" | "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [state, setState] = useState<VerifyState>(token ? "verifying" : "idle");
  const [message, setMessage] = useState(
    token ? "" : "Open the verification link from your email, or request a new one below.",
  );
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const verifyToken = useCallback(async (value: string) => {
    setState("verifying");
    setMessage("");

    try {
      const response = await fetch(
        `/api/auth/verify-email?token=${encodeURIComponent(value)}`,
        { method: "POST" },
      );
      const result = await response.json();

      if (!response.ok) {
        setState("error");
        setMessage(result.message || "This verification link is invalid or has expired.");
        return;
      }

      setState("success");
      setMessage(result.message || "Your email has been verified successfully.");
    } catch {
      setState("error");
      setMessage("We could not reach the server. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (token) void verifyToken(token);
  }, [token, verifyToken]);

  async function resendVerification() {
    setResending(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", { method: "PUT" });
      const result = await response.json();

      if (!response.ok) {
        setResendMessage(
          result.message ||
            (response.status === 401
              ? "Sign in to request a new verification email."
              : "Could not send verification email."),
        );
        return;
      }

      setResendMessage(result.message || "Verification email sent. Check your inbox.");
    } catch {
      setResendMessage("We could not reach the server. Please try again.");
    } finally {
      setResending(false);
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
        className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-lg items-center justify-center sm:min-h-[calc(100vh-2.5rem)]"
      >
        <div className="w-full rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_30px_100px_rgba(22,51,81,0.14)] sm:p-10">
          <div className="flex justify-center">
            <BrandLogo />
          </div>

          <div className="mt-8 text-center">
            <StatusIcon state={state} />
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
              {state === "success"
                ? "Email verified"
                : state === "error"
                  ? "Verification failed"
                  : state === "verifying"
                    ? "Verifying your email"
                    : "Verify your email"}
            </h1>
            {message ? (
              <p
                className={`mt-3 text-sm leading-7 ${
                  state === "error" ? "text-red-600" : "text-slate-500"
                }`}
              >
                {message}
              </p>
            ) : null}
          </div>

          {state === "success" ? (
            <Link
              href="/dashboard"
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:bg-[#006fe8]"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="mt-8 space-y-4">
              {state === "error" || state === "idle" ? (
                <>
                  <button
                    type="button"
                    onClick={() => void resendVerification()}
                    disabled={resending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:bg-[#006fe8] disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {resending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Sending email...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Resend verification email
                      </>
                    )}
                  </button>
                  {resendMessage ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm text-slate-500"
                    >
                      {resendMessage}
                    </motion.p>
                  ) : null}
                  <p className="text-center text-sm text-slate-500">
                    Need an account?{" "}
                    <Link href="/login" className="font-semibold text-btnBg hover:underline">
                      Sign in
                    </Link>
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-btnBg" />
                  Please wait...
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

function StatusIcon({ state }: { state: VerifyState }) {
  if (state === "success") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <XCircle className="h-9 w-9" />
      </div>
    );
  }

  if (state === "verifying") {
    return (
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-btnBg/10 text-btnBg">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
      <MailCheck className="h-8 w-8" />
    </div>
  );
}
