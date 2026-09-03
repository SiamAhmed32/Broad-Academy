import type { SVGProps } from "react";

/**
 * Lucide-react ships no brand marks, so these are hand-drawn to match the
 * official logos closely enough for small badge use.
 */

export const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M13.5 21v-8.2h2.75l.41-3.2h-3.16V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.14C16.5 3.1 15.53 3 14.39 3c-2.37 0-4 1.45-4 4.11v2.49H7.63v3.2h2.76V21h3.11Z" />
  </svg>
);

export const WhatsAppIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.14-.2.3-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.33-1.44a8.7 8.7 0 0 1-1.6-2c-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.65-1.58-.9-2.16-.24-.57-.48-.49-.65-.5-.17-.01-.37-.01-.56-.01-.2 0-.51.07-.78.37-.26.29-1.02 1-1.02 2.43s1.05 2.82 1.19 3.01c.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.11.56-.08 1.7-.7 1.95-1.37.24-.68.24-1.26.17-1.38-.07-.13-.26-.2-.55-.35Z" />
    <path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.08-1.33A9.96 9.96 0 0 0 12.02 22c5.52 0 10-4.48 10-10S17.54 2 12.02 2Zm0 18.2a8.16 8.16 0 0 1-4.17-1.14l-.3-.18-3.02.79.81-2.94-.2-.31A8.19 8.19 0 1 1 12.02 20.2Z" />
  </svg>
);

export const YouTubeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.42a2.78 2.78 0 0 0-1.95 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 2C5.12 20 12 20 12 20s6.88 0 8.59-.42a2.78 2.78 0 0 0 1.95-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
  </svg>
);

/** Parent + parent + child silhouette, used for "for parents" badges. */
export const FamilyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 40 24" fill="currentColor" aria-hidden {...props}>
    <circle cx="8" cy="5" r="3.4" />
    <path d="M1.2 22.4c0-4.6 3-8 6.8-8s6.8 3.4 6.8 8v.6H1.2v-.6Z" />
    <circle cx="32" cy="5" r="3.4" />
    <path d="M25.2 22.4c0-4.6 3-8 6.8-8s6.8 3.4 6.8 8v.6H25.2v-.6Z" />
    <circle cx="20" cy="10" r="2.7" />
    <path d="M14.7 22.4c0-3.6 2.4-6.3 5.3-6.3s5.3 2.7 5.3 6.3v.6H14.7v-.6Z" />
  </svg>
);
