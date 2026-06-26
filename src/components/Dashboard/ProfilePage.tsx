"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

type Tab = "profile" | "security";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(iso);
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputClass =
  "peer h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-navy outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-btnBg focus:ring-4 focus:ring-btnBg/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface ToastState {
  message: string;
  type: ToastType;
  key: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage({ user: initialUser }: { user: UserProfile }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);

  function showToast(message: string, type: ToastType) {
    setToast({ message, type, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleLogout() {
    setLogoutPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const initials = getInitials(user.fullName);

  return (
    <main className="min-h-screen bg-[#f3f7fb] pb-16">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={reduceMotion ? false : { opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold"
            style={{
              background: toast.type === "success" ? "#163351" : "#ef4444",
              color: "#fff",
            }}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4 text-[#70ddbd] shrink-0" />
            ) : (
              <span className="shrink-0 text-white/80">✕</span>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-navy/8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-btnBg transition-colors">
            <span className="text-navy/40">←</span>
            Dashboard
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/40">Profile Settings</span>
          <button
            onClick={handleLogout}
            disabled={logoutPending}
            className="flex items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            {logoutPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">

        {/* ── Profile Hero ──────────────────────────────────────────────────── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] bg-navy p-7 text-white shadow-2xl shadow-navy/20 sm:p-10"
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.2)_1px,transparent_0)] [background-size:28px_28px]" />
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-btnBg/25 blur-2xl"
          />
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 14, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-accent/20 blur-2xl"
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Avatar */}
            <motion.div
              initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-navy shadow-lg"
              style={{
                background: "linear-gradient(135deg, #70ddbd 0%, #059669 100%)",
              }}
            >
              {initials}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 backdrop-blur">
                  <Sparkles className="h-3 w-3 text-[#70ddbd]" />
                  {user.role === "ADMIN" ? "Administrator" : "Student"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                    user.status === "ACTIVE"
                      ? "bg-accent/20 text-[#70ddbd]"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.status === "ACTIVE" ? "bg-[#70ddbd]" : "bg-red-400"
                    }`}
                  />
                  {user.status === "ACTIVE" ? "Active" : "Suspended"}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {user.fullName}
              </h1>
              <p className="mt-1.5 text-white/60 text-sm">{user.email}</p>
            </div>

            {/* Meta stats */}
            <div className="flex gap-5 sm:flex-col sm:gap-3 sm:text-right">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">Member since</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{formatDate(user.createdAt)}</p>
              </div>
              {user.lastLoginAt && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">Last login</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{formatRelative(user.lastLoginAt)}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Tab Switcher ──────────────────────────────────────────────────── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm border border-navy/8"
        >
          {(["profile", "security"] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className="relative flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{
                color: activeTab === tab ? "#163351" : "#94a3b8",
              }}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl bg-[#f3f7fb]"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {tab === "profile" ? (
                  <UserRound className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {tab === "profile" ? "Personal Info" : "Security"}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" ? (
            <motion.div
              key="profile"
              initial={reduceMotion ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <ProfileTab
                user={user}
                onUpdate={(updated) => {
                  setUser(updated);
                  showToast("Profile updated successfully.", "success");
                }}
                onError={(msg) => showToast(msg, "error")}
                reduceMotion={Boolean(reduceMotion)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="security"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <SecurityTab
                onSuccess={(msg) => showToast(msg, "success")}
                onError={(msg) => showToast(msg, "error")}
                reduceMotion={Boolean(reduceMotion)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({
  user,
  onUpdate,
  onError,
  reduceMotion,
}: {
  user: UserProfile;
  onUpdate: (u: UserProfile) => void;
  onError: (msg: string) => void;
  reduceMotion: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError("");
    setFields({});

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      phone: form.get("phone"),
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        setFormError(result.message || "Something went wrong.");
        setFields(result.fields || {});
        return;
      }

      onUpdate(result.data);
    } catch {
      onError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      {/* Edit form */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-3xl border border-navy/8 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-btnBg/8">
            <UserRound className="h-4.5 w-4.5 text-btnBg" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-navy">Personal Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your name and contact details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <FormField id="fullName" label="Full name" icon={<UserRound />} error={fields.fullName?.[0]}>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              defaultValue={user.fullName}
              placeholder="Your full name"
              className={inputClass}
              aria-invalid={Boolean(fields.fullName)}
            />
          </FormField>

          <FormField id="email" label="Email address" icon={<Mail />} readOnly>
            <input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
              className={inputClass}
            />
          </FormField>

          <FormField id="phone" label="Phone number" icon={<Phone />} optional error={fields.phone?.[0]}>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={user.phone ?? ""}
              placeholder="01XXXXXXXXX"
              className={inputClass}
              aria-invalid={Boolean(fields.phone)}
            />
          </FormField>

          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {formError}
            </motion.p>
          )}

          <motion.button
            whileHover={reduceMotion ? undefined : { y: -1 }}
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            type="submit"
            disabled={pending}
            id="save-profile-btn"
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition hover:bg-[#006fe8] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-65"
          >
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving changes…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Account info card */}
      <div className="flex flex-col gap-5">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-navy/8 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/8">
              <ShieldCheck className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy">Account Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your account information</p>
            </div>
          </div>

          <dl className="mt-5 space-y-4">
            <InfoRow
              icon={<UserRound className="h-4 w-4" />}
              label="Account type"
              value={user.role === "ADMIN" ? "Administrator" : "Student"}
            />
            <InfoRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Account status"
              value={
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.status === "ACTIVE"
                      ? "bg-accent/10 text-accent"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.status === "ACTIVE" ? "bg-accent" : "bg-red-500"
                    }`}
                  />
                  {user.status === "ACTIVE" ? "Active" : "Suspended"}
                </span>
              }
            />
            <InfoRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
            {user.lastLoginAt && (
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Last login"
                value={formatRelative(user.lastLoginAt)}
              />
            )}
          </dl>
        </motion.div>

        {/* Email note */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-3xl border border-amber-200/60 bg-amber-50/60 p-5"
        >
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Email cannot be changed</p>
              <p className="mt-1 text-xs leading-5 text-amber-700/80">
                Your email address is used to identify your account and cannot be updated from here. Contact support if you need to change it.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({
  onSuccess,
  onError,
  reduceMotion,
}: {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  reduceMotion: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: "8+ characters", passed: newPassword.length >= 8 },
      { label: "Uppercase letter", passed: /[A-Z]/.test(newPassword) },
      { label: "Lowercase letter", passed: /[a-z]/.test(newPassword) },
      { label: "Number", passed: /\d/.test(newPassword) },
    ],
    [newPassword],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError("");
    setFields({});

    const form = new FormData(event.currentTarget);
    const payload = {
      currentPassword: form.get("currentPassword"),
      newPassword: form.get("newPassword"),
      confirmNewPassword: form.get("confirmNewPassword"),
    };

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        setFormError(result.message || "Something went wrong.");
        setFields(result.fields || {});
        return;
      }

      setDone(true);
      onSuccess(result.message);
      (event.target as HTMLFormElement).reset();
      setNewPassword("");
    } catch {
      onError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      {/* Change password form */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-3xl border border-navy/8 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy/8">
            <KeyRound className="h-4.5 w-4.5 text-navy" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-navy">Change Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose a strong, unique password</p>
          </div>
        </div>

        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent">
                <Check className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">Password updated</p>
                <p className="text-xs text-slate-500 mt-0.5">Other devices have been signed out for your security.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <FormField id="currentPassword" label="Current password" icon={<LockKeyhole />} error={fields.currentPassword?.[0]}>
            <div className="relative">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your current password"
                className={`${inputClass} pr-11`}
                aria-invalid={Boolean(fields.currentPassword)}
              />
              <PasswordToggle visible={showCurrent} onClick={() => setShowCurrent((v) => !v)} />
            </div>
          </FormField>

          <FormField id="newPassword" label="New password" icon={<LockKeyhole />} error={fields.newPassword?.[0]}>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Choose a strong new password"
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-11`}
                aria-invalid={Boolean(fields.newPassword)}
              />
              <PasswordToggle visible={showNew} onClick={() => setShowNew((v) => !v)} />
            </div>
          </FormField>

          {/* Password strength indicator */}
          {newPassword && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3"
            >
              {passwordChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    check.passed ? "text-accent" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                      check.passed ? "bg-accent text-white" : "bg-slate-200"
                    }`}
                  >
                    {check.passed && <Check className="h-2.5 w-2.5" />}
                  </span>
                  {check.label}
                </div>
              ))}
            </motion.div>
          )}

          <FormField id="confirmNewPassword" label="Confirm new password" icon={<LockKeyhole />} error={fields.confirmNewPassword?.[0]}>
            <div className="relative">
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                className={`${inputClass} pr-11`}
                aria-invalid={Boolean(fields.confirmNewPassword)}
              />
              <PasswordToggle visible={showConfirm} onClick={() => setShowConfirm((v) => !v)} />
            </div>
          </FormField>

          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {formError}
            </motion.p>
          )}

          <motion.button
            whileHover={reduceMotion ? undefined : { y: -1 }}
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            type="submit"
            disabled={pending}
            id="change-password-btn"
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white shadow-lg shadow-navy/20 transition hover:bg-navy/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-65"
          >
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Updating password…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Update password
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Security info */}
      <div className="flex flex-col gap-5">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-navy/8 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/8">
              <ShieldCheck className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy">Security Info</h2>
              <p className="text-xs text-slate-400 mt-0.5">How we keep your account safe</p>
            </div>
          </div>

          <ul className="mt-5 space-y-4">
            {[
              {
                icon: <ShieldCheck className="h-4 w-4 text-accent" />,
                title: "Session protection",
                desc: "Your session uses an HttpOnly cookie that cannot be read by JavaScript — protecting you from XSS attacks.",
              },
              {
                icon: <LockKeyhole className="h-4 w-4 text-btnBg" />,
                title: "Bcrypt hashing",
                desc: "Your password is stored as a bcrypt hash (cost factor 12) — it is never stored in plain text.",
              },
              {
                icon: <LogOut className="h-4 w-4 text-navy" />,
                title: "Session invalidation",
                desc: "Changing your password automatically signs out all other devices for your security.",
              },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-3xl border border-navy/8 bg-navy p-5 text-white"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">Password tips</p>
          <ul className="mt-3 space-y-2">
            {[
              "Use a unique password not used on other sites",
              "At least 8 characters with mixed case and numbers",
              "Avoid personal info like birthdays or names",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs leading-5 text-white/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#70ddbd]" />
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Reusable Sub-components ──────────────────────────────────────────────────
function FormField({
  id,
  label,
  icon,
  error,
  optional,
  readOnly,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  optional?: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-navy">
          {label}
        </label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
        {readOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            <LockKeyhole className="h-2.5 w-2.5" />
            Read only
          </span>
        )}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4.5 [&>svg]:w-4.5">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function PasswordToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
        <span className="text-slate-300">{icon}</span>
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold text-navy">{value}</dd>
    </div>
  );
}
