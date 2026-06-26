"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, LoaderCircle, Mail, MailX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { BrandLogo } from "@/components/Brand";

export default function UnsubscribePage() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

  const [email, setEmail] = useState(searchParams.get("email")?.trim() ?? "");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    const payload: { email: string; token?: string } = { email: email.trim() };
    if (tokenFromUrl) payload.token = tokenFromUrl;

    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "We could not process your request.");
        return;
      }

      setDone(true);
      setMessage(
        result.message || "You have been unsubscribed from Broad Academy updates.",
      );
    } catch {
      setError("We could not reach the server. Please try again.");
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
        className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-lg items-center justify-center sm:min-h-[calc(100vh-2.5rem)]"
      >
        <div className="w-full rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_30px_100px_rgba(22,51,81,0.14)] sm:p-10">
          <div className="flex justify-center">
            <BrandLogo />
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-navy">
                You&apos;re unsubscribed
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-500">{message}</p>
              <Link
                href="/"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-navy px-6 text-sm font-semibold text-white transition hover:bg-navy/90"
              >
                Back to home
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <MailX className="h-8 w-8" />
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                  Unsubscribe from updates
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Enter the email you used to subscribe. We&apos;ll stop sending
                  Broad Academy newsletter messages to that address.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="unsubscribe-email"
                    className="mb-2 block text-sm font-semibold text-navy"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="unsubscribe-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
                    />
                  </div>
                </div>

                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </motion.div>
                ) : null}

                <motion.button
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  type="submit"
                  disabled={pending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:bg-[#006fe8] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {pending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Unsubscribe"
                  )}
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Changed your mind?{" "}
                <Link href="/" className="font-semibold text-btnBg hover:underline">
                  Return to Broad Academy
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
