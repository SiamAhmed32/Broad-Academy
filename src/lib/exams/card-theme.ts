/**
 * Per-card colour + banner artwork for the exam grid.
 *
 * Exams have no colour column, so each card picks a stable theme from a hash of
 * its slug. The same exam therefore always renders in the same colour, and a
 * grid of exams comes out varied like the design reference.
 */

export type ExamCardTheme = {
  /** Banner gradient — Tailwind `from-*`/`via-*`/`to-*` classes. */
  banner: string;
  /** Enroll button background + hover. */
  button: string;
  /** Badge text colour used on the white pills over the banner. */
  badgeText: string;
};

const examCardThemes: ExamCardTheme[] = [
  {
    banner: "from-[#0f5132] via-[#146c43] to-[#0a3622]",
    button: "bg-[#146c43] hover:bg-[#0f5132]",
    badgeText: "text-[#0f5132]",
  },
  {
    banner: "from-[#0b4f4a] via-[#12786f] to-[#07332f]",
    button: "bg-[#12786f] hover:bg-[#0b4f4a]",
    badgeText: "text-[#0b4f4a]",
  },
  {
    banner: "from-[#0b2f6b] via-[#1258b8] to-[#071f47]",
    button: "bg-[#1258b8] hover:bg-[#0b2f6b]",
    badgeText: "text-[#0b2f6b]",
  },
  {
    banner: "from-[#3b1160] via-[#6a1fa8] to-[#26073f]",
    button: "bg-[#6a1fa8] hover:bg-[#3b1160]",
    badgeText: "text-[#3b1160]",
  },
  {
    banner: "from-[#7c2d12] via-[#c2540a] to-[#4a1a0b]",
    button: "bg-[#c2540a] hover:bg-[#7c2d12]",
    badgeText: "text-[#7c2d12]",
  },
  {
    banner: "from-[#7f1020] via-[#c01c2e] to-[#4d0a14]",
    button: "bg-[#c01c2e] hover:bg-[#7f1020]",
    badgeText: "text-[#7f1020]",
  },
  {
    banner: "from-[#0d2a4a] via-[#17527f] to-[#08192c]",
    button: "bg-[#17527f] hover:bg-[#0d2a4a]",
    badgeText: "text-[#0d2a4a]",
  },
  {
    banner: "from-[#6b3105] via-[#a8560c] to-[#3f1d03]",
    button: "bg-[#a8560c] hover:bg-[#6b3105]",
    badgeText: "text-[#6b3105]",
  },
];

/** Stable, non-cryptographic string hash so a slug always maps to one theme. */
function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function examCardTheme(slug: string): ExamCardTheme {
  return examCardThemes[hashString(slug) % examCardThemes.length];
}

/**
 * Splits an exam title into the artwork label and the big number shown on the
 * banner: "SSC Weekly Test 01" with code "SSC" becomes "WEEKLY TEST" + "01".
 */
export function examBannerArt(title: string, code: string | null) {
  let label = title.trim();

  if (code) {
    const prefix = code.trim();
    if (prefix && label.toLowerCase().startsWith(prefix.toLowerCase())) {
      label = label.slice(prefix.length).trim();
    }
  }

  const trailing = label.match(/\s(\d{1,3})$/);
  const number = trailing ? trailing[1].padStart(2, "0") : null;
  if (trailing) label = label.slice(0, trailing.index).trim();

  return {
    label: (label || title).toUpperCase(),
    number,
  };
}
