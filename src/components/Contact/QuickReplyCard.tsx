"use client";

import { Loader2, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api/client";

type FormState = "idle" | "loading" | "success" | "error";

const QuickReplyCard = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const result = await apiFetch("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email, source: "contact-section" }),
    });

    if (!result.success) {
      setState("error");
      setMessage(result.message ?? "কিছু একটা সমস্যা হয়েছে।");
      return;
    }

    setState("success");
    setMessage(result.message ?? "ধন্যবাদ! আপনি সাবস্ক্রাইব করেছেন।");
    setEmail("");
  };

  return (
    <div className="rounded-3xl border border-[#EDF0F5] bg-[#EEF4FF] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#125BFF] text-white">
          <Mail className="h-4.5 w-4.5" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-[#0D1321] sm:text-base">
            দ্রুত উত্তর পেতে চান?
          </h4>
          <p className="mt-1 text-xs leading-6 text-[#64748B] sm:text-sm">
            আমাদের নিউজলেটারে সাবস্ক্রাইব করুন এবং সর্বশেষ আপডেট ও টিপস পান
            সরাসরি।
          </p>
        </div>
      </div>

      {state === "success" ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-2.5 text-xs font-medium text-[#0D1321]">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="quick-reply-email" className="sr-only">
            ইমেইল ঠিকানা
          </label>
          <input
            id="quick-reply-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="আপনার ইমেইল দিন"
            className="h-11 w-full min-w-0 flex-1 rounded-xl border border-[#EDF0F5] bg-white px-4 text-xs text-[#0D1321] outline-none transition placeholder:text-[#64748B]/70 focus:border-[#125BFF] focus:ring-2 focus:ring-[#125BFF]/20 sm:text-sm"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#125BFF] px-4 text-xs font-bold text-white transition hover:bg-[#125BFF]/90 disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
          >
            {state === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                সাবস্ক্রাইব করুন
              </>
            )}
          </button>
        </form>
      )}
      {state === "error" && message ? (
        <p className="mt-2 text-xs text-red-600">{message}</p>
      ) : null}
    </div>
  );
};

export default QuickReplyCard;
