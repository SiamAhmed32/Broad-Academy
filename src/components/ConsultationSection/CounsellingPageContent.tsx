"use client";

import { CalendarCheck, ShieldCheck } from "lucide-react";

import BookingForm from "./BookingForm";

export default function CounsellingPageContent() {
  return (
    <section className="bg-[#f4f8fc]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="rounded-3xl border border-navy/10 bg-white p-5 shadow-[0_24px_60px_rgba(22,51,81,0.12)] sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-btnBg/10 text-btnBg">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-bangla text-lg font-semibold text-navy sm:text-xl">
                স্টাডি প্ল্যান ও কাউন্সেলিং সেশনের জন্য আবেদন করুন
              </h1>
              <p className="font-bangla mt-1 text-sm leading-6 text-navy/70">
                সর্তকতার সাথে ফরমটি ফিলাপ করুন, খুব অল্প কথায় শিক্ষার্থীর সমস্যাগুলো
                জানান পরবর্তীতে আমাদের টিম আপনার সাথে যোগাযোগ করবে।
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                Fees confirmed before the session
              </p>
            </div>
          </div>

          <BookingForm />
        </div>
      </div>
    </section>
  );
}
