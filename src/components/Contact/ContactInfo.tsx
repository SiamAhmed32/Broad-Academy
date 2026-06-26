"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { contactMethods } from "@/components/data/contactData";

type ContactInfoProps = {
  compact?: boolean;
};

const ContactInfo = ({ compact = false }: ContactInfoProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-4">
      {contactMethods.map((method, index) => {
        const Icon = method.icon;
        const card = (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
            whileHover={reduceMotion ? undefined : { y: -3 }}
            className="group rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(22,51,81,0.06)] backdrop-blur-sm transition hover:border-accent/20 hover:shadow-[0_18px_50px_rgba(22,51,81,0.1)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy transition group-hover:bg-accent/10 group-hover:text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {method.label}
                </p>
                <p
                  className={
                    compact
                      ? "mt-1 text-base font-semibold text-navy"
                      : "mt-1 text-lg font-semibold text-navy"
                  }
                >
                  {method.value}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {method.description}
                </p>
              </div>
            </div>
          </motion.div>
        );

        if ("href" in method && method.href) {
          return (
            <Link key={method.label} href={method.href} className="block">
              {card}
            </Link>
          );
        }

        return (
          <div key={method.label}>
            {card}
          </div>
        );
      })}
    </div>
  );
};

export default ContactInfo;
