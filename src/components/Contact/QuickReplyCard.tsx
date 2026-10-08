"use client";

import { Loader2, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api/client";
import { notify } from "@/lib/toast";

const QuickReplyCard = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setInvalid(false);

    const result = await apiFetch("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email, source: "contact-section" }),
    });

    setLoading(false);

    if (!result.success) {
      // One message only: the field error if there is one, else the general one.
      setInvalid(Boolean(result.fields?.email?.length));
      notify.error(
        result.fields?.email?.[0] ?? result.message ?? "কিছু একটা সমস্যা হয়েছে।",
      );
      return;
    }

    notify.success(result.message ?? "ধন্যবাদ! আপনি সাবস্ক্রাইব করেছেন।");
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

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="quick-reply-email" className="sr-only">
          ইমেইল ঠিকানা
        </label>
        <input
          id="quick-reply-email"
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setInvalid(false);
          }}
          aria-invalid={invalid}
          placeholder="আপনার ইমেইল দিন"
          className="h-11 w-full min-w-0 flex-1 rounded-xl border border-[#EDF0F5] bg-white px-4 text-xs text-[#0D1321] outline-none transition placeholder:text-[#64748B]/70 focus:border-[#125BFF] focus:ring-2 focus:ring-[#125BFF]/20 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20 sm:text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#125BFF] px-4 text-xs font-bold text-white transition hover:bg-[#125BFF]/90 disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              সাবস্ক্রাইব করুন
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default QuickReplyCard;
