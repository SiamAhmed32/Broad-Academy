import { CirclePlay } from "lucide-react";

/** Opens a question's explanation video (a YouTube link set by the admin). */
export default function ExplanationVideoLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-bangla mt-3 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
    >
      <CirclePlay className="h-4 w-4" />
      ব্যাখ্যার ভিডিও দেখো
    </a>
  );
}
