"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { AdminPageHeader } from "@/components/Admin";
import { adminNavItems } from "@/lib/admin/nav";
import {
  getPermissionsForUser,
  type AdminUser,
} from "@/lib/admin/permissions";

type AdminWelcomeProps = {
  user: AdminUser;
};

export default function AdminWelcome({ user }: AdminWelcomeProps) {
  const shouldReduceMotion = useReducedMotion();
  const permissions = getPermissionsForUser(user);
  const cards = adminNavItems.filter((item) => permissions.includes(item.permission));

  const uniqueCards = cards.filter(
    (item, index, array) => array.findIndex((x) => x.href === item.href) === index,
  );

  return (
    <div>
      <AdminPageHeader
        title={`Welcome, ${user.fullName.split(" ")[0]}`}
        description="Choose a section below to manage Broad Academy. Your menu only shows areas you have access to."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {uniqueCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-soft transition group-hover:bg-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-navy">{item.label}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <span className="mt-4 text-sm font-semibold text-accent">Open →</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
