"use client";

import { Loader2, Mail, Send, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api/client";
import { Container } from "@/components/reusables";

type FormState = "idle" | "loading" | "success" | "error";

const NewsletterPage = () => {
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
    const honeypot = (form.elements.namedItem("website") as HTMLInputElement)
      ?.value;

    const result = await apiFetch("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({
        email,
        source: "homepage",
        website: honeypot,
      }),
    });

    if (!result.success) {
      setState("error");
      setFieldError(result.fields?.email?.[0] ?? "");
      setMessage(result.message ?? "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      return;
    }

    setState("success");
    setMessage(result.message ?? "ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন।");
    setEmail("");
  };

  return (
    <section className="bg-[#FDFDFD] py-14 sm:py-16 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-[#FCFCFE] bg-white shadow-[0_10px_40px_-20px_rgba(2,88,250,0.15)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full bg-[#F2F6FE]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#F2F6FE]"
          />

          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-8 lg:p-14">
            <div>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2F6FE] text-[#0258FA]">
                <Mail className="h-7 w-7" fill="currentColor" />
              </span>

              <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#00132A] sm:text-4xl">
                সর্বশেষ আপডেট পান
              </h2>

              <p className="mt-4 text-lg font-bold leading-8 text-[#00132A]">
                নতুন কোর্স, শিক্ষামূলক রিসোর্স ও গুরুত্বপূর্ণ ঘোষণার সঙ্গে
                সবসময় যুক্ত থাকুন।
              </p>

              <p className="mt-4 max-w-md text-sm leading-7 text-[#42506B] sm:text-base">
                আমাদের নিউজলেটারে যুক্ত হয়ে পরীক্ষার প্রস্তুতি, শেখার কৌশল,
                নতুন কোর্সের আপডেট এবং অভিভাবকদের জন্য প্রয়োজনীয় তথ্য সবার
                আগে পান। সম্পূর্ণ স্প্যাম-মুক্ত, যেকোনো সময় আনসাবস্ক্রাইব করার
                সুবিধা রয়েছে।
              </p>

              <div className="mt-6">
                {state === "success" ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-[#0258FA]/20 bg-[#F2F6FE] px-4 py-4 text-[#00132A]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0258FA]" />
                    <p className="text-sm leading-6 sm:text-base">{message}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    <label className="sr-only" htmlFor="homepage-newsletter-email">
                      ইমেইল ঠিকানা
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#42506B]" />
                        <input
                          id="homepage-newsletter-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          autoComplete="email"
                          placeholder="আপনার ইমেইল"
                          className="h-14 w-full rounded-2xl border border-[#FCFCFE] bg-white pl-11 pr-4 text-sm text-[#00132A] outline-none transition placeholder:text-[#42506B]/70 focus:border-[#0258FA] focus:ring-2 focus:ring-[#0258FA]/20"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={state === "loading"}
                        className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0258FA] px-6 text-sm font-bold text-white transition hover:bg-[#0258FA]/90 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {state === "loading" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            সাবস্ক্রাইব করুন
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
                      <p className="text-sm text-red-500">{fieldError}</p>
                    ) : null}
                    {state === "error" && message ? (
                      <p className="text-sm text-red-500">{message}</p>
                    ) : null}
                  </form>
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px]">
              <Image
                src="/newsletter/newsletter-illustration.png"
                alt="নিউজলেটার সাবস্ক্রিপশন ইলাস্ট্রেশন"
                width={1350}
                height={1165}
                className="h-auto w-full object-contain"
                sizes="(max-width: 1024px) 100vw, 520px"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default NewsletterPage;
