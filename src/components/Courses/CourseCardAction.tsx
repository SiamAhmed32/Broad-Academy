"use client";

import { ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Shared across every card on the page so the list is fetched once, and
// refreshed after a short while so a new enrollment shows up quickly.
const CACHE_MS = 30_000;
let enrolledSlugsRequest: Promise<Set<string>> | null = null;
let requestedAt = 0;

function loadEnrolledSlugs() {
  if (enrolledSlugsRequest && Date.now() - requestedAt < CACHE_MS) {
    return enrolledSlugsRequest;
  }
  requestedAt = Date.now();
  enrolledSlugsRequest = fetch("/api/student/enrolled-courses", {
    credentials: "same-origin",
    cache: "no-store",
  })
    .then((response) => (response.ok ? response.json() : null))
    .then(
      (payload: { data?: { slugs?: string[] } } | null) =>
        new Set(payload?.data?.slugs ?? []),
    )
    .catch(() => new Set<string>());
  return enrolledSlugsRequest;
}

export default function CourseCardAction({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadEnrolledSlugs().then((slugs) => {
      if (!cancelled) setEnrolled(slugs.has(slug));
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (enrolled) {
    return (
      <Link
        href={`/learn/${slug}`}
        aria-label={`Continue ${title}`}
        className="relative z-10 flex h-11 w-full items-center justify-center rounded-xl bg-btnBg text-sm font-semibold text-white transition hover:bg-btnBgDark"
      >
        <PlayCircle className="mr-2 h-4 w-4" />
        Continue Course
      </Link>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-full items-center justify-center rounded-xl bg-navy text-sm font-semibold text-white transition group-hover:bg-btnBg"
    >
      এনরোল করুন
      <ArrowRight className="ml-2 h-4 w-4" />
    </span>
  );
}
