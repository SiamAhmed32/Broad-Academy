import { ArrowLeft, ArrowUpRight, Megaphone, Pin } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";
import type { SerializedNotice } from "@/lib/notices/service";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

export default function NoticesPage({ notices }: { notices: SerializedNotice[] }) {
  return (
    <main className="min-h-[70vh] bg-[#f8fbff]">
      <Container>
        <div className="mx-auto max-w-3xl py-12 sm:py-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-body transition hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          <header className="mt-6 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Megaphone className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                Academy Notices
              </h1>
              <p className="mt-1 text-base text-body">
                Official updates from Broad Academy.
              </p>
            </div>
          </header>

          {notices.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-navy/8 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-navy">No notices right now</p>
              <p className="mt-2 text-sm text-body">
                New announcements from Broad Academy will appear here.
              </p>
            </div>
          ) : (
            <ol className="mt-10 space-y-4">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <article
                    className={`rounded-2xl border bg-white p-6 shadow-sm sm:p-7 ${
                      notice.pinned ? "border-accent/30" : "border-navy/8"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      {notice.pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      ) : null}
                      <time dateTime={notice.publishedAt} className="text-body">
                        {dateFormatter.format(new Date(notice.publishedAt))}
                      </time>
                    </div>
                    <h2 className="font-bangla mt-3 text-xl font-semibold leading-snug text-navy sm:text-2xl">
                      {notice.title}
                    </h2>
                    <p className="font-bangla mt-3 whitespace-pre-line text-base leading-8 text-[#1f2d45]">
                      {notice.body}
                    </p>
                    {notice.linkUrl ? (
                      <a
                        href={notice.linkUrl}
                        {...(notice.linkUrl.startsWith("http")
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-btnBg px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-btnBgDark"
                      >
                        {notice.linkLabel || "Open link"}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Container>
    </main>
  );
}
