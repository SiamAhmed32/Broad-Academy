"use client";

import { motion, useReducedMotion } from "framer-motion";

import { contactFaq } from "@/components/data/contactData";
import { Container } from "@/components/reusables";

import ContactForm from "./ContactForm";
import ContactHeader from "./ContactHeader";
import ContactInfo from "./ContactInfo";

const ContactPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main className="bg-[#f3f7fb]">
      <section className="relative overflow-hidden bg-navy pb-16 pt-28 text-white sm:pt-32">
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-btnBg/20 blur-3xl" />

        <Container className="relative">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8cf0d0]">
              Contact Broad Academy
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Let&apos;s Talk About Your Learning Goals
            </h1>
            <p className="mt-4 text-base leading-7 text-white/75 sm:text-lg">
              Whether you are a parent exploring courses or a student preparing
              for exams, our team is ready to help you choose the right path.
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="relative -mt-10 pb-16 sm:pb-20">
        <Container>
          <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_rgba(22,51,81,0.08)] backdrop-blur-sm sm:p-8">
                <ContactHeader variant="page" />
                <div className="mt-8">
                  <ContactInfo />
                </div>
              </div>

              <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_70px_rgba(22,51,81,0.06)] sm:p-8">
                <h3 className="text-lg font-semibold text-navy">Quick answers</h3>
                <div className="mt-5 space-y-4">
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
