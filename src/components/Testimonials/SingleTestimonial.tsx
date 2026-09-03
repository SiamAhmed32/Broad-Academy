import { Star } from "lucide-react";
import Image from "next/image";

import type { TestimonialItem } from "@/components/data/testimonialData";

const SingleTestimonial = ({ testData }: { testData: TestimonialItem }) => {
  const rating = Math.max(1, Math.min(5, Math.round(testData.rating ?? 5)));
  const [role, batch] = testData.identity.split(",").map((part) => part.trim());

  return (
    <div className="flex h-[420px] flex-col rounded-2xl bg-white px-8 py-7 shadow-lg shadow-indigo-950/5">
      <div className="flex w-full items-center justify-between">
        <div className="translate-y-2 font-serif text-6xl leading-none text-indigo-200">
          “
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`h-5 w-5 text-yellow-400 ${
                index < rating ? "fill-yellow-400" : "fill-transparent opacity-40"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-soft ring-2 ring-navy/10">
          <Image
            src={testData.image}
            alt={testData.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-h-[54px]">
          <h5 className="text-lg font-semibold text-navy">{testData.name}</h5>
          <h6 className="text-sm font-semibold text-indigo-600">{role}</h6>
          {batch && <p className="text-xs text-navy/50">{batch}</p>}
        </div>
      </div>

      <div className="mt-5 h-[3px] w-10 shrink-0 rounded-full bg-indigo-600" />

      <p className="mt-4 line-clamp-5 flex-1 overflow-hidden leading-7 text-navy/70">
        {testData.review}
      </p>
    </div>
  );
};

export default SingleTestimonial;
