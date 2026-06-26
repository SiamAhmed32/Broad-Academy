"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import {
  contactRoles,
  contactSubjects,
  contactRoleLabels,
  contactSubjectLabels,
} from "@/lib/contact/validation";

type ContactFormProps = {
  source: "homepage" | "contact-page";
};

type FieldErrors = Record<string, string[] | undefined>;

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10";

const selectClass =
  "h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-sm text-navy outline-none transition hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10";

const textareaClass =
  "min-h-[140px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10";

function fieldError(fields: FieldErrors, name: string) {
  return fields[name]?.[0];
}

const ContactForm = ({ source }: ContactFormProps) => {
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [messageLength, setMessageLength] = useState(0);

  const roleOptions = useMemo(
    () =>
      contactRoles.map((role) => ({
        value: role,
        label: contactRoleLabels[role],
      })),
    [],
  );

  const subjectOptions = useMemo(
    () =>
      contactSubjects.map((subject) => ({
        value: subject,
        label: contactSubjectLabels[subject],
      })),
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      role: form.get("role"),
      subject: form.get("subject"),
      message: form.get("message"),
      source,
      website: form.get("website"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Something went wrong. Please try again.");
        setFields(result.fields || {});
        return;
      }

      setSubmitted(true);
      setMessage(result.message);
      event.currentTarget.reset();
      setMessageLength(0);
    } catch {
      setMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/80 bg-white p-8 text-center shadow-[0_20px_70px_rgba(22,51,81,0.08)] sm:p-10"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-navy">Message sent</h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
          {message ||
            "Thank you. Our team will review your message and get back to you soon."}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setMessage("");
          }}
          className="mt-6 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_70px_rgba(22,51,81,0.08)] sm:p-8"
      noValidate
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-btnBg/10 text-btnBg">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-navy">Send us a message</h3>
          <p className="mt-1 text-sm text-slate-600">
            Fill in the form and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy">
            Full name
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              className={`${inputClass} pl-10`}
              aria-invalid={Boolean(fieldError(fields, "fullName"))}
            />
          </div>
          {fieldError(fields, "fullName") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "fullName")}</p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
            aria-invalid={Boolean(fieldError(fields, "email"))}
          />
          {fieldError(fields, "email") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "email")}</p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy">
            Phone <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            className={inputClass}
            aria-invalid={Boolean(fieldError(fields, "phone"))}
          />
          {fieldError(fields, "phone") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "phone")}</p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-navy">
            I am a
          </label>
          <select
            id="role"
            name="role"
            defaultValue=""
            className={selectClass}
            aria-invalid={Boolean(fieldError(fields, "role"))}
          >
            <option value="" disabled>
              Select one
            </option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError(fields, "role") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "role")}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            defaultValue=""
            className={selectClass}
            aria-invalid={Boolean(fieldError(fields, "subject"))}
          >
            <option value="" disabled>
              What is this about?
            </option>
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError(fields, "subject") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "subject")}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            placeholder="Tell us about your class, goals, or question..."
            className={textareaClass}
            maxLength={2000}
            onChange={(event) => setMessageLength(event.target.value.length)}
            aria-invalid={Boolean(fieldError(fields, "message"))}
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            {fieldError(fields, "message") ? (
              <p className="text-xs text-red-600">{fieldError(fields, "message")}</p>
            ) : (
              <p className="text-xs text-slate-500">Minimum 20 characters</p>
            )}
            <p className="text-xs text-slate-400">{messageLength}/2000</p>
          </div>
        </div>
      </div>

      {message && !submitted && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </motion.form>
  );
};

export default ContactForm;
