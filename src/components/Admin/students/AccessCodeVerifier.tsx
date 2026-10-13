"use client";

import { CheckCircle2, ShieldAlert, ShieldCheck, Users, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";

import { AdminButton, AdminCard, AdminInput } from "@/components/Admin";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type VerifyResult =
  | { found: false; code: string }
  | {
      found: true;
      code: string;
      active: boolean;
      enrollmentStatus: string;
      accountStatus: string;
      studentName: string;
      studentEmail: string;
      studentId: string | null;
      courseTitle: string;
      enrolledAt: string;
      emailMatches: boolean | null;
    };

/** Lets the Facebook group admin check a join request before approving it. */
export default function AccessCodeVerifier() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (code.trim().length < 4) {
      setError("Enter the access code from the join request.");
      return;
    }
    setChecking(true);
    setError("");
    const params = new URLSearchParams({ code: code.trim() });
    if (email.trim()) params.set("email", email.trim());
    const response = await adminFetch<VerifyResult>(`/api/admin/enrollments/verify-code?${params}`);
    setChecking(false);
    if (!response.success || !response.data) {
      setResult(null);
      setError(response.message ?? "Could not check this code.");
      return;
    }
    setResult(response.data);
  }

  const verdict = !result
    ? null
    : !result.found
      ? { tone: "bad" as const, title: "Don't approve — this code doesn't exist.", text: "Ask the student to copy the code again from their course page." }
      : !result.active
        ? {
            tone: "bad" as const,
            title: "Don't approve — this enrollment is not active.",
            text: `Enrollment: ${result.enrollmentStatus.toLowerCase()} · Account: ${result.accountStatus.toLowerCase()}.`,
          }
        : result.emailMatches === false
          ? {
              tone: "warn" as const,
              title: "Check first — the email doesn't match.",
              text: `This code belongs to ${result.studentEmail}. Ask the student to use their enrollment email.`,
            }
          : {
              tone: "good" as const,
              title:
                result.emailMatches === true
                  ? "OK to approve — code and email match."
                  : "Code is valid. Compare the email before approving.",
              text: "Make sure the course below is the course of this Facebook group.",
            };

  return (
    <AdminCard className="mb-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2]/10 text-[#1877f2]">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-navy">Verify a Facebook group join request</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Students give their access code and enrollment email when they ask to join a course group.
          </p>
        </div>
      </div>

      <form onSubmit={verify} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
        <AdminInput
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Access code, e.g. BA-7KQ2M9XA"
          aria-label="Access code"
          className="font-mono uppercase"
        />
        <AdminInput
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email the student gave (optional)"
          aria-label="Email from the join request"
        />
        <AdminButton type="submit" isLoading={checking}>
          <ShieldCheck className="h-4 w-4" /> Check
        </AdminButton>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {verdict ? (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            verdict.tone === "good"
              ? "border-emerald-200 bg-emerald-50"
              : verdict.tone === "warn"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
          }`}
        >
          <p className="flex items-center gap-2 font-semibold text-navy">
            {verdict.tone === "good" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : verdict.tone === "warn" ? (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {verdict.title}
          </p>
          <p className="mt-1 text-sm text-slate-600">{verdict.text}</p>
          {result?.found ? (
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Student</dt>
                <dd className="font-medium text-navy">
                  {result.studentName}
                  {result.studentId ? <span className="text-slate-400"> · ID {result.studentId}</span> : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Enrollment email</dt>
                <dd className="break-all font-medium text-navy">{result.studentEmail}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Course</dt>
                <dd className="font-medium text-navy">{result.courseTitle}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Enrolled</dt>
                <dd className="font-medium text-navy">{formatAdminDate(result.enrolledAt)}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
    </AdminCard>
  );
}
