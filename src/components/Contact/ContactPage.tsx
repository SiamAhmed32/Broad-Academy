"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Container } from "@/components/reusables";

import ContactForm from "./ContactForm";
import ContactInfo from "./ContactInfo";

const ContactPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main className="w-full overflow-x-hidden bg-[#f3f7fb]">
      <section className="relative isolate overflow-hidden bg-navy pb-10 pt-24 text-white sm:pb-20 sm:pt-28 lg:pt-32">
        <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 -z-10 h-64 w-64 rounded-full bg-btnBg/20 blur-3xl" />

        <Container className="relative">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto w-full max-w-3xl px-1 text-center"
          >
            <h1 className="text-pretty text-3xl font-semibold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              Contact Broad Academy
            </h1>
            <p
              lang="bn"
              className="font-bangla mt-3 text-pretty text-sm leading-7 text-white/75 sm:mt-4 sm:text-base sm:leading-8 lg:text-lg"
            >
              অভিভাবক, শিক্ষার্থী, শিক্ষক ও মেন্টরদের জন্য সঠিক দিকনির্দেশনা,
              পরিকল্পনা এবং প্রয়োজনীয় সহায়তা দিতে আমাদের টিম সর্বদা প্রস্তুত।
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="relative pb-12 sm:-mt-10 sm:pb-16 lg:pb-20">
        <Container>
          <div className="grid min-w-0 grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div className="min-w-0 space-y-6 sm:space-y-8">
              <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_20px_70px_rgba(22,51,81,0.08)] backdrop-blur-sm sm:rounded-3xl sm:p-6 lg:p-8">
                <h2 className="text-lg font-semibold text-navy sm:text-xl">
                  Contact details
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                  Reach us by email, phone, or send a message using the form.
                </p>
                <div className="mt-6 sm:mt-8">
                  <ContactInfo />
                </div>
              </div>
            </div>

            <ContactForm source="contact-page" />
          </div>
        </Container>
      </section>
    </main>
  );
};

export default ContactPage;
