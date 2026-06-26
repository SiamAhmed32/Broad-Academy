import { Star } from "lucide-react";
import Image from "next/image";

import type { TestimonialItem } from "@/components/data/testimonialData";

const SingleTestimonial = ({ testData }: { testData: TestimonialItem }) => {
  const rating = Math.max(1, Math.min(5, Math.round(testData.rating ?? 5)));

  return (
    <div className="h-80 rounded-md bg-navy shadow-lg shadow-navy/20">
      <div className="flex h-full flex-col items-center justify-center gap-6 px-8 py-4">
        <div className="flex w-full items-center justify-between">
          <div className="translate-y-3 font-serif text-6xl leading-none text-soft">“</div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-6 w-6 text-yellow-400 ${
                  index < rating ? "fill-yellow-400" : "fill-transparent opacity-40"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="line-clamp-4 min-h-[112px] leading-7 text-soft/90">
          {testData.review}
        </p>

        <div className="flex w-full justify-start gap-8">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-soft ring-2 ring-white/70">
            <Image
              src={testData.image}
              alt={testData.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div>
            <h5 className="text-[18px] font-medium text-soft">{testData.name}</h5>
            <h6 className="text-soft/65">{testData.identity}</h6>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleTestimonial;
