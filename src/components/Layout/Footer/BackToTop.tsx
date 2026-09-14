"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

function resetNode(node: Element | Window | null) {
  if (!node) return;
  try {
    if ("scrollTo" in node) node.scrollTo(0, 0);
  } catch {
    /* ignore */
  }
}

export function jumpToPageTop() {
  resetNode(window);
  resetNode(document.documentElement);
  resetNode(document.body);
  resetNode(document.scrollingElement);

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  let node: HTMLElement | null = document.body;
  while (node) {
    if (node.scrollTop > 0) node.scrollTop = 0;
    node = node.parentElement;
  }
}

function ScrollTopIcon({ className }: { className: string }) {
  return <ArrowUp className={className} />;
}

export default function BackToTop() {
  return (
    <button
      type="button"
      data-scroll-top
      aria-label="Back to top"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:border-accent/40 hover:bg-accent/15"
    >
      <ScrollTopIcon className="h-4 w-4" />
    </button>
  );
}

export function FloatingScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setVisible(y > 240);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-scroll-top]")) return;
      event.preventDefault();
      jumpToPageTop();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      data-scroll-top
      aria-label="Back to top"
      className="fixed right-5 z-[220] flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-[0_12px_30px_rgba(22,51,81,0.28)] transition hover:bg-btnBg max-md:bottom-24 md:bottom-6"
    >
      <ScrollTopIcon className="h-5 w-5" />
    </button>
  );
}
