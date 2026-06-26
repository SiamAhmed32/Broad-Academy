import type { Metadata } from "next";
import { Suspense } from "react";

import VerifyEmailPage from "@/components/Auth/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Verify Email | Broad Academy",
  description: "Confirm your Broad Academy student account email address.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailRoute() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f3f7fb] text-sm text-slate-500">
          Loading...
        </main>
      }
    >
      <VerifyEmailPage />
    </Suspense>
  );
}
