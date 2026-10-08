import { Check, Download, Eye, FileText, MessageSquareReply } from "lucide-react";

import type { StudentSubmission } from "@/lib/documents/student";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

const statusMeta: Record<
  StudentSubmission["status"],
  { label: string; badge: string; step: number; final?: "good" | "bad" }
> = {
  PENDING: { label: "Waiting for review", badge: "bg-amber-50 text-amber-700", step: 1 },
  REVIEWED: { label: "Reviewed", badge: "bg-sky-50 text-sky-700", step: 2 },
  APPROVED: { label: "Approved", badge: "bg-emerald-50 text-emerald-700", step: 3, final: "good" },
  REJECTED: { label: "Needs attention", badge: "bg-red-50 text-red-700", step: 3, final: "bad" },
};

const steps = ["Submitted", "Under review", "Completed"];

export default function MySubmissions({
  submissions,
}: {
  submissions: StudentSubmission[];
}) {
  return (
    <section id="my-submissions" className="mx-auto mt-10 max-w-2xl scroll-mt-28">
      <h2 className="text-2xl font-semibold tracking-tight text-navy">My submissions</h2>
      <p className="mt-1 text-sm text-navy/60">
        Track each document and read replies from the Broad Academy team.
      </p>

      <ul className="mt-5 space-y-4">
        {submissions.map((submission) => {
          const meta = statusMeta[submission.status];
          const hasReply = Boolean(submission.reviewNote || submission.hasReplyFile);
          return (
            <li
              key={submission.id}
              className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{submission.documentType}</p>
                  <p className="mt-0.5 text-xs text-navy/50">
                    Submitted {dateFormatter.format(new Date(submission.createdAt))}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>

              <ProgressSteps step={meta.step} final={meta.final} />

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-navy/40" />
                <span className="min-w-0 truncate text-navy/70">
                  {submission.fileName ?? "Uploaded file"}
                </span>
                <a
                  href={`/api/documents/${submission.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 font-medium text-btnBg hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </a>
              </div>

              {hasReply ? (
                <div className="mt-4 rounded-xl border border-btnBg/15 bg-btnBg/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <MessageSquareReply className="h-4 w-4 text-btnBg" />
                    Reply from Broad Academy
                    {submission.reviewedAt ? (
                      <span className="font-normal text-navy/45">
                        · {dateFormatter.format(new Date(submission.reviewedAt))}
                      </span>
                    ) : null}
                  </p>
                  {submission.reviewNote ? (
                    <p className="font-bangla mt-2 whitespace-pre-line text-sm leading-7 text-navy/80">
                      {submission.reviewNote}
                    </p>
                  ) : null}
                  {submission.hasReplyFile ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`/api/documents/${submission.id}/file?which=reply`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-navy/5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {submission.replyFileName ?? "Open attachment"}
                      </a>
                      <a
                        href={`/api/documents/${submission.id}/file?which=reply&download=1`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-navy/5"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProgressSteps({ step, final }: { step: number; final?: "good" | "bad" }) {
  return (
    <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Submission progress">
      {steps.map((label, index) => {
        const reached = index + 1 <= step;
        const isLast = index === steps.length - 1;
        const tone =
          !reached
            ? "bg-navy/10"
            : isLast && final === "bad"
              ? "bg-red-500"
              : isLast && final === "good"
                ? "bg-emerald-500"
                : "bg-btnBg";
        return (
          <li key={label}>
            <div className={`h-1.5 rounded-full ${tone}`} />
            <p
              className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${
                reached ? "text-navy" : "text-navy/40"
              }`}
            >
              {reached ? <Check className="h-3 w-3" /> : null}
              {isLast && final === "bad" ? "Needs attention" : label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
