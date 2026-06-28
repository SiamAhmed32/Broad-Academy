"use client";

import { motion, useReducedMotion } from "framer-motion";

import { contactFaq } from "@/components/data/contactData";
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
            <span className="inline-flex max-w-full items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8cf0d0] sm:px-4 sm:text-xs sm:tracking-[0.16em]">
              Contact Broad Academy
            </span>
            <h1 className="mt-4 text-pretty text-3xl font-semibold tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl">
              Let&apos;s Talk About Your Learning Goals
            </h1>
            <p className="mt-3 text-pretty text-sm leading-6 text-white/75 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg">
              Whether you are a parent exploring courses or a student preparing
              for exams, our team is ready to help you choose the right path.
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

              <div className="min-w-0 rounded-2xl border border-white/80 bg-white p-4 shadow-[0_20px_70px_rgba(22,51,81,0.06)] sm:rounded-3xl sm:p-6 lg:p-8">
                <h3 className="text-base font-semibold text-navy sm:text-lg">
                  Quick answers
                </h3>
                <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                  {contactFaq.map((item) => (
                    <div
                      key={item.question}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-navy">{item.question}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.answer}
                      </p>
                    </div>
                  ))}
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
