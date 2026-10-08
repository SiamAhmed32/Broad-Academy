"use client";

import { Check, Copy, ExternalLink, Users } from "lucide-react";
import { useState } from "react";

/**
 * Backup way to watch classes: students join the course's private Facebook
 * group using their unique access code and enrollment email, which the group
 * admin checks against the admin panel before approving.
 */
export default function FacebookGroupAccess({
  accessCode,
  groupUrl,
  email,
}: {
  accessCode: string;
  groupUrl: string | null;
  email: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="font-bangla mt-5 rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_18px_50px_rgba(22,51,81,.06)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2]/10 text-[#1877f2]">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-navy sm:text-lg">
            ফেসবুক গ্রুপ থেকেও ক্লাস দেখতে পারবে
          </h2>
          <p className="mt-1 text-sm leading-6 text-navy/60">
            ভিডিও চালাতে সমস্যা হলে কোর্সের প্রাইভেট ফেসবুক গ্রুপে জয়েন রিকোয়েস্ট দাও।
            রিকোয়েস্টের সময় নিচের সিক্রেট কোড এবং তোমার এনরোলমেন্ট ইমেইল (
            <span className="font-medium text-navy">{email}</span>) দিতে হবে।
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-dashed border-btnBg/40 bg-btnBg/5 px-4 py-3">
          <span className="font-mono text-lg font-bold tracking-[0.12em] text-navy">
            {accessCode}
          </span>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-navy/5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "কপি হয়েছে" : "কপি করো"}
          </button>
        </div>
        {groupUrl ? (
          <a
            href={groupUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe0]"
          >
            গ্রুপে জয়েন করো <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
