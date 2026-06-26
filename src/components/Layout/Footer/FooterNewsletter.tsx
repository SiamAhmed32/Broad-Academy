"use client";

import { ArrowRight, CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api/client";

type FormState = "idle" | "loading" | "success" | "error";

const FooterNewsletter = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setMessage("");
    setFieldError("");

    const form = event.currentTarget;
    const honeypot = (form.elements.namedItem("website") as HTMLInputElement)?.value;

    const result = await apiFetch("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({
        email,
        source: "footer",
        website: honeypot,
      }),
    });

    if (!result.success) {
      setState("error");
      setFieldError(result.fields?.email?.[0] ?? "");
      setMessage(result.message ?? "Something went wrong. Please try again.");
      return;
    }

    setState("success");
    setMessage(result.message ?? "Thanks for subscribing!");
    setEmail("");
  };

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(5,150,105,0.18),transparent_55%)]"
      />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Stay Updated
          </span>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            Get learning tips & course updates
          </h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/70 sm:text-base">
            Join our newsletter for exam prep guides, new course launches, and
            parent resources — no spam, unsubscribe anytime.
          </p>
        </div>

        <div>
          {state === "success" ? (
            <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-4 text-soft">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm leading-6 sm:text-base">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <label className="sr-only" htmlFor="footer-newsletter-email">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-white/15 bg-white pl-11 pr-4 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {state === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />

              {fieldError ? (
                <p className="text-sm text-red-300">{fieldError}</p>
              ) : null}
              {state === "error" && message ? (
                <p className="text-sm text-red-300">{message}</p>
              ) : null}

              <p className="text-xs leading-5 text-white/45">
                By subscribing you agree to our{" "}
                <a href="/privacy-policy" className="underline hover:text-white/70">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FooterNewsletter;
