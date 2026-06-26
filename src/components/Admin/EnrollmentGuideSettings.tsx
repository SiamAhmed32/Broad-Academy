"use client";

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";

import {
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminField,
  AdminInput,
} from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";

export default function EnrollmentGuideSettings() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await adminFetch<{ enrollmentGuideYoutubeUrl: string | null }>(
        "/api/admin/site-config",
      );
      if (res.success && res.data) {
        setUrl(res.data.enrollmentGuideYoutubeUrl ?? "");
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await adminFetch("/api/admin/site-config", {
      method: "PATCH",
      body: JSON.stringify({ enrollmentGuideYoutubeUrl: url.trim() || null }),
    });
    setSaving(false);
    setMessage(res.success ? "Enrollment guide video saved." : res.message ?? "Could not save.");
  }

  return (
    <AdminCard className="mb-6">
      <AdminCardTitle className="flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-accent" />
        Enrollment guide video
      </AdminCardTitle>
      <p className="mt-2 text-sm text-slate-600">
        Students see a &quot;How to enroll&quot; button on course pages. Paste a YouTube link to
        your walkthrough video.
      </p>
      <form onSubmit={save} className="mt-4 space-y-4">
        <AdminField label="YouTube URL" hint="Watch, Shorts, or youtu.be links are supported">
          <AdminInput
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={loading}
          />
        </AdminField>
        <div className="flex items-center gap-3">
          <AdminButton type="submit" isLoading={saving} disabled={loading}>
            Save guide video
          </AdminButton>
          {message ? <p className="text-sm text-navy/60">{message}</p> : null}
        </div>
      </form>
    </AdminCard>
  );
}
