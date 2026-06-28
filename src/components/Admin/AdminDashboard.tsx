"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  FileText,
  GraduationCap,
  Mail,
  Megaphone,
  MessageSquare,
  ReceiptText,
  TrendingUp,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AdminPageHeader } from "@/components/Admin";
import { adminNavItems } from "@/lib/admin/nav";
import { ADMIN_PERMISSIONS, getPermissionsForUser, type AdminUser } from "@/lib/admin/permissions";

type Stats = {
  students: number;
  activeEnrollments: number;
  pendingEnrollmentRequests: number;
  pendingExamEnrollmentRequests: number;
  totalRevenue: number;
  pendingCounselling: number;
  newContactMessages: number;
  pendingDocuments: number;
  publishedCourses: number;
  newsletterSubscribers: number;
};

export default function AdminDashboard({ user }: { user: AdminUser }) {
  const reduceMotion = useReducedMotion();
  const permissions = getPermissionsForUser(user);
  const cards = adminNavItems.filter((item) => {
    const required = item.anyOfPermissions ?? [item.permission];
    return required.some((permission) => permissions.includes(permission));
  });
  const uniqueCards = cards.filter(
    (item, index, array) => array.findIndex((x) => x.href === item.href) === index,
  );
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetch("/api/admin/stats", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setStats(payload.data);
      })
      .catch(() => undefined);
  }, []);

  const statCards = stats
    ? [
        { label: "Active students", value: stats.students, icon: Users, tone: "bg-sky-50 text-sky-700" },
        { label: "Course enrollments", value: stats.activeEnrollments, icon: BookOpenCheck, tone: "bg-emerald-50 text-emerald-700" },
        { label: "Revenue verified", value: `৳${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, tone: "bg-violet-50 text-violet-700" },
        { label: "Course payments", value: stats.pendingEnrollmentRequests, icon: ReceiptText, tone: "bg-amber-50 text-amber-800", href: "/admin/students?tab=requests" },
        { label: "Exam payments", value: stats.pendingExamEnrollmentRequests, icon: ClipboardCheck, tone: "bg-amber-50 text-amber-800", href: "/admin/exams/requests" },
        { label: "Counselling queue", value: stats.pendingCounselling, icon: CalendarDays, tone: "bg-blue-50 text-blue-700", href: "/admin/counselling" },
        { label: "New messages", value: stats.newContactMessages, icon: Mail, tone: "bg-rose-50 text-rose-700", href: "/admin/contact" },
        { label: "Document reviews", value: stats.pendingDocuments, icon: FileText, tone: "bg-orange-50 text-orange-800", href: "/admin/documents" },
        { label: "Newsletter subs", value: stats.newsletterSubscribers, icon: Megaphone, tone: "bg-teal-50 text-teal-700", href: "/admin/newsletter" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Welcome back, ${user.fullName.split(" ")[0]}`}
        description="Platform overview and quick access to every admin area."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const content = (
            <motion.div
              key={card.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold text-navy">{card.value}</p>
              <p className="mt-1 text-sm text-slate-500">{card.label}</p>
            </motion.div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-navy">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {uniqueCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.href}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
              >
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-soft transition group-hover:bg-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-navy">{item.label}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <span className="mt-4 text-sm font-semibold text-accent">Open →</span>
                </Link>
              </motion.div>
            );
          })}
          {permissions.includes(ADMIN_PERMISSIONS.NOTICES) ? (
            <Link
              href="/admin/offers"
              className="group flex h-full flex-col rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-5 transition hover:bg-accent/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">Send student offer</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                Push a course promotion to all students or one student via notifications.
              </p>
              <span className="mt-4 text-sm font-semibold text-accent">Compose →</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
