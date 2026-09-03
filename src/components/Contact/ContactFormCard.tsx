"use client";

import { CheckCircle2, LoaderCircle, Send, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { contactSubjects } from "@/lib/contact/validation";

const subjectLabelsBn: Record<(typeof contactSubjects)[number], string> = {
  enrollment: "কোর্স ভর্তি",
  "course-inquiry": "কোর্স সম্পর্কিত জিজ্ঞাসা",
  admission: "ভর্তি সহায়তা",
  consultation: "ফ্রি পরামর্শ",
  technical: "কারিগরি সহায়তা",
  partnership: "পার্টনারশিপ",
  other: "অন্যান্য",
};

type FieldErrors = Record<string, string[] | undefined>;

const inputClass =
  "h-12 w-full rounded-xl border border-[#EDF0F5] bg-white px-4 text-sm text-[#0D1321] outline-none transition placeholder:text-[#64748B]/70 hover:border-[#125BFF]/40 focus:border-[#125BFF] focus:ring-4 focus:ring-[#125BFF]/10";

const selectClass =
  "h-12 w-full appearance-none rounded-xl border border-[#EDF0F5] bg-white px-4 text-sm text-[#0D1321] outline-none transition hover:border-[#125BFF]/40 focus:border-[#125BFF] focus:ring-4 focus:ring-[#125BFF]/10";

const textareaClass =
  "min-h-[140px] w-full resize-y rounded-xl border border-[#EDF0F5] bg-white px-4 py-3 text-sm text-[#0D1321] outline-none transition placeholder:text-[#64748B]/70 hover:border-[#125BFF]/40 focus:border-[#125BFF] focus:ring-4 focus:ring-[#125BFF]/10";

function fieldError(fields: FieldErrors, name: string) {
  return fields[name]?.[0];
}

const ContactFormCard = () => {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      role: "other",
      subject: form.get("subject"),
      message: form.get("message"),
      source: "homepage",
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
        setMessage(result.message || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        setFields(result.fields || {});
        return;
      }

      setSubmitted(true);
      setMessage(result.message);
      event.currentTarget.reset();
    } catch {
      setMessage("সার্ভারে পৌঁছানো যায়নি। আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-3xl border border-[#EDF0F5] bg-white p-6 text-center shadow-[0_10px_40px_-20px_rgba(2,88,250,0.12)] sm:min-h-[420px] sm:p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E7F7ED] text-[#16A34A]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-[#0D1321]">বার্তা পাঠানো হয়েছে</h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-[#64748B]">
          {message || "ধন্যবাদ। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।"}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setMessage("");
          }}
          className="mt-6 rounded-xl bg-[#125BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#125BFF]/90"
        >
          আরেকটি বার্তা পাঠান
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-[#EDF0F5] bg-white p-5 shadow-[0_10px_40px_-20px_rgba(2,88,250,0.12)] sm:p-6 lg:p-8"
      noValidate
    >
      <h3 className="text-base font-bold text-[#0D1321] sm:text-lg">
        আমরা আপনার কথা শুনতে চাই
      </h3>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="website-bn">Website</label>
        <input id="website-bn" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName-bn" className="mb-1.5 block text-sm font-medium text-[#0D1321]">
            আপনার নাম <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <input
              id="fullName-bn"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="আপনার নাম লিখুন"
              className={`${inputClass} pl-10`}
              aria-invalid={Boolean(fieldError(fields, "fullName"))}
            />
          </div>
          {fieldError(fields, "fullName") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "fullName")}</p>
          )}
        </div>

        <div>
          <label htmlFor="email-bn" className="mb-1.5 block text-sm font-medium text-[#0D1321]">
            ইমেইল ঠিকানা <span className="text-red-500">*</span>
          </label>
          <input
            id="email-bn"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="আপনার ইমেইল দিন"
            className={inputClass}
            aria-invalid={Boolean(fieldError(fields, "email"))}
          />
          {fieldError(fields, "email") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "email")}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="subject-bn" className="mb-1.5 block text-sm font-medium text-[#0D1321]">
            বিষয় <span className="text-red-500">*</span>
          </label>
          <select
            id="subject-bn"
            name="subject"
            defaultValue=""
            className={selectClass}
            aria-invalid={Boolean(fieldError(fields, "subject"))}
          >
            <option value="" disabled>
              বিষয় নির্বাচন করুন
            </option>
            {contactSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subjectLabelsBn[subject]}
              </option>
            ))}
          </select>
          {fieldError(fields, "subject") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "subject")}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message-bn" className="mb-1.5 block text-sm font-medium text-[#0D1321]">
            বার্তা <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message-bn"
            name="message"
            placeholder="আপনার বার্তা লিখুন..."
            className={textareaClass}
            maxLength={2000}
            aria-invalid={Boolean(fieldError(fields, "message"))}
          />
          {fieldError(fields, "message") && (
            <p className="mt-1 text-xs text-red-600">{fieldError(fields, "message")}</p>
          )}
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
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#125BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#125BFF]/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            পাঠানো হচ্ছে...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            বার্তা পাঠান
          </>
        )}
      </button>
    </form>
  );
};

export default ContactFormCard;
