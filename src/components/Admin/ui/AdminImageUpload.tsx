"use client";

import { ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type UploadPurpose =
  | "course-thumbnail"
  | "instructor-avatar"
  | "instructor-cover"
  | "testimonial-avatar"
  | "campaign-image"
  | "exam-banner"
  | "exam-question-image";

type AdminImageUploadProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  purpose: UploadPurpose;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  aspect?: "video" | "square" | "cover";
  onUploadingChange?: (uploading: boolean) => void;
  fieldError?: string;
};

const aspectClasses = {
  video: "aspect-video w-full max-w-[520px]",
  square: "aspect-square w-full max-w-[240px]",
  cover: "aspect-[3/1] w-full max-w-[640px]",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AdminImageUpload({
  label,
  value,
  onChange,
  purpose,
  hint = "JPG, PNG, or WebP. Maximum 5 MB.",
  required = false,
  disabled = false,
  aspect = "video",
  onUploadingChange,
  fieldError,
}: AdminImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const previewUrl = localPreviewUrl || value;

  useEffect(() => {
    return () => {
      if (localPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  async function uploadFile(file: File) {
    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setUploading(true);
    onUploadingChange?.(true);

    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);

    try {
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: { url?: string };
      } | null;

      if (!response.ok || !payload?.success || !payload.data?.url) {
        throw new Error(payload?.message || "Image upload failed.");
      }

      onChange(payload.data.url);
      setLocalPreviewUrl("");
    } catch (uploadError) {
      setLocalPreviewUrl("");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed. Please try again.",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    if (uploading) return;
    onChange("");
    setLocalPreviewUrl("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-navy">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
        {previewUrl && !uploading ? (
          <span className="text-xs font-medium text-emerald-700">Upload ready</span>
        ) : null}
      </div>

      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-dashed bg-slate-50 transition",
          error || fieldError ? "border-red-300" : "border-slate-300 hover:border-accent/60",
          aspectClasses[aspect],
        )}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-navy/0 opacity-0 transition group-hover:bg-navy/55 group-hover:opacity-100 group-focus-within:bg-navy/55 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || uploading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-navy shadow-sm disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-accent">
              <ImagePlus className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy">Choose an image</span>
              <span className="mt-1 block text-xs text-slate-500">
                A preview appears here before you save
              </span>
            </span>
          </button>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 text-navy backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <span className="text-sm font-semibold">Uploading securely...</span>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
        className="sr-only"
      />

      <div className="flex items-start gap-2 text-xs text-slate-500">
        <UploadCloud className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className={cn(fieldError || error ? "text-red-600" : undefined)}>
          {fieldError || error || hint}
        </span>
      </div>
    </div>
  );
}
