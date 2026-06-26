import type { Metadata } from "next";
import { Suspense } from "react";

import UnsubscribePage from "@/components/Newsletter/UnsubscribePage";

export const metadata: Metadata = {
  title: "Unsubscribe | Broad Academy Newsletter",
  description: "Unsubscribe from Broad Academy email updates and newsletters.",
  robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribeRoute() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f3f7fb] text-sm text-slate-500">
          Loading...
        </main>
      }
    >
      <UnsubscribePage />
    </Suspense>
  );
}
