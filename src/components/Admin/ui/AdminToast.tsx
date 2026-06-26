"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

export function useAdminToast() {
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const ToastViewport = (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.message}
          initial={{ opacity: 0, y: -12, x: 12 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -8, x: 12 }}
          className={`fixed right-4 top-4 z-[100] flex max-w-sm items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-2xl ${
            toast.error ? "bg-red-600" : "bg-navy"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.error ? (
            <XCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
          )}
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return { showToast, ToastViewport };
}
