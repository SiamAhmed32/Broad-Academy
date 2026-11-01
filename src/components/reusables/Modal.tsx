"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const emptySubscribe = () => () => {};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  insetOnMobile?: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.97,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

const modalSizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  insetOnMobile = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.addEventListener("keydown", handleEscape);
    // Lock the root as well as the body: mobile browsers can otherwise pan
    // the document horizontally behind a fixed, portalled dialog.
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [isOpen, handleEscape]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={`fixed inset-0 z-[100] flex min-w-0 justify-center sm:items-center sm:p-4 ${insetOnMobile ? "items-center px-0 py-3" : "items-end p-0"}`}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative z-10 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${insetOnMobile ? "w-[calc(100%-1rem)] max-h-[calc(100dvh-1.5rem)] rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-full" : "w-full max-h-[92vh] rounded-t-2xl"} ${modalSizes[size]}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:scale-95"
              aria-label="Close dialog"
              type="button"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>

            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
