"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Paperclip,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/components/ConsultationSection/FormField";
import FormSelect from "@/components/ConsultationSection/FormSelect";
import { Container } from "@/components/reusables";
import {
  DOCUMENT_TYPES,
  documentSubmissionSchema,
} from "@/lib/documents/validation";
import { apiFetch } from "@/lib/api/client";

type DocumentFormInput = z.infer<typeof documentSubmissionSchema>;

export type SubmitDocumentsProfile = {
  fullName: string;
  email: string;
  phone: string | null;
};

type SubmitDocumentsPageProps = {
  profile: SubmitDocumentsProfile;
};

const inputShell =
  "rounded-xl border border-navy/10 bg-[#f7f9fc] px-4 py-3 text-sm text-navy placeholder:text-navy/35 outline-none transition focus:border-btnBg focus:bg-white focus:ring-2 focus:ring-btnBg/10";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export default function SubmitDocumentsPage({ profile }: SubmitDocumentsPageProps) {
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormInput>({
    resolver: zodResolver(documentSubmissionSchema),
    defaultValues: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone ?? "",
      documentType: undefined,
      message: "",
      website: "",
    },
  });

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("File must be 8 MB or smaller.");
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setFileError("Upload a JPG, PNG, WebP, or PDF file.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const onSubmit = async (data: DocumentFormInput) => {
    if (!selectedFile) {
      setFileError("Upload a PDF or image file.");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("phone", data.phone ?? "");
    formData.append("documentType", data.documentType);
    formData.append("message", data.message ?? "");
    formData.append("website", data.website ?? "");
    formData.append("document", selectedFile);

    const result = await apiFetch<{ id: string }>("/api/documents/submit", {
      method: "POST",
      body: formData,
      timeoutMs: 90_000,
    });

    if (!result.success) {
      if (result.fields) {
        for (const [field, messages] of Object.entries(result.fields)) {
          if (Array.isArray(messages) && messages.length > 0) {
            setError(field as keyof DocumentFormInput, {
              message: messages[0],
            });
          }
        }
        if (result.fields.document?.[0]) {
          setFileError(result.fields.document[0]);
        }
      } else {
        setError("root", {
          message: result.message ?? "Something went wrong. Please try again.",
        });
      }
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <main className="bg-[#f3f7fb]">
      <section className="relative overflow-hidden bg-navy pb-16 pt-28 text-white sm:pt-32">
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-btnBg/20 blur-3xl" />

        <Container className="relative">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8cf0d0]">
              <FileUp className="h-3.5 w-3.5" />
              Student documents
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Submit Your Documents
            </h1>
            <p className="mt-4 text-base leading-7 text-white/75 sm:text-lg">
              Upload assignments, report cards, or other academic files securely.
              Our team will review and follow up if anything else is needed.
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="relative -mt-10 pb-16 sm:pb-20">
        <Container>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl rounded-2xl border border-white/80 bg-white p-6 shadow-[0_20px_70px_rgba(22,51,81,0.08)] sm:p-8"
          >
            {isSubmitted ? (
              <SuccessState />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <p className="text-sm leading-relaxed text-amber-950/80">
                    Files are encrypted in transit and only visible to authorised
                    Broad Academy staff. Accepted formats: JPG, PNG, WebP, PDF (max
                    8 MB).
                  </p>
                </div>

                {errors.root ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {errors.root.message}
                  </motion.div>
                ) : null}

                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                  {...register("website")}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Full name"
                    id="doc-fullName"
                    error={errors.fullName?.message}
                    {...register("fullName")}
                    placeholder="Your full name"
                    autoComplete="name"
                    className={inputShell}
                  />
                  <FormField
                    label="Email"
                    id="doc-email"
                    type="email"
                    error={errors.email?.message}
                    {...register("email")}
                    placeholder="you@example.com"
                    autoComplete="email"
                    readOnly
                    className={`${inputShell} cursor-not-allowed opacity-80`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Phone"
                    id="doc-phone"
                    type="tel"
                    error={errors.phone?.message}
                    {...register("phone")}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    className={inputShell}
                  />
                  <FormSelect
                    label="Document type"
                    id="doc-documentType"
                    error={errors.documentType?.message}
                    {...register("documentType")}
                    options={DOCUMENT_TYPES as unknown as string[]}
                    placeholder="Select type"
                    className={inputShell}
                  />
                </div>

                <div>
                  <label
                    htmlFor="doc-message"
                    className="mb-1.5 block text-sm font-medium text-navy/80"
                  >
                    Message{" "}
                    <span className="font-normal text-navy/40">(optional)</span>
                  </label>
                  <textarea
                    id="doc-message"
                    rows={3}
                    className={`w-full resize-none text-sm outline-none transition ${inputShell}`}
                    placeholder="Add context about this document, class, or deadline..."
                    {...register("message")}
                  />
                  {errors.message ? (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.message.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-navy/80">
                    Upload document
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
                      fileError
                        ? "border-red-300 bg-red-50/50"
                        : selectedFile
                          ? "border-accent/40 bg-accent/5"
                          : "border-navy/15 bg-[#f7f9fc] hover:border-btnBg/40 hover:bg-white"
                    }`}
                  >
                    {selectedFile ? (
                      <>
                        <Paperclip className="h-6 w-6 text-accent" />
                        <span className="text-sm font-medium text-navy">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-navy/50">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — tap to
                          change
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-navy/40" />
                        <span className="text-sm font-medium text-navy">
                          Tap to choose a file
                        </span>
                        <span className="text-xs text-navy/50">
                          PDF, JPG, PNG, or WebP up to 8 MB
                        </span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    onChange={onFileChange}
                  />
                  {fileError ? (
                    <p className="mt-1 text-xs text-red-500">{fileError}</p>
                  ) : null}
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-btnBg px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-btnBg/20 transition-all hover:bg-btnBg/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading document...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4" />
                      Submit document
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </Container>
      </section>
    </main>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
      >
        <CheckCircle2 className="h-9 w-9" />
      </motion.div>
      <h3 className="mt-5 text-xl font-semibold text-navy">Document submitted</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy/55">
        Your file was received securely. Our team will review it and contact you if
        we need anything else.
      </p>
    </motion.div>
  );
}
