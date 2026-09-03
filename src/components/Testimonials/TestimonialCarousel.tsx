"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import type { TestimonialItem } from "../data/testimonialData";
import { Container } from "../reusables";
import SingleTestimonial from "./SingleTestimonial";

import "swiper/css";

type TestimonialCarouselProps = {
  testimonials: TestimonialItem[];
};

function TestimonialCardSkeleton() {
  return (
    <div className="flex h-[420px] animate-pulse flex-col rounded-2xl bg-white px-8 py-7 shadow-lg shadow-indigo-950/5">
      <div className="flex w-full items-center justify-between">
        <div className="h-10 w-10 rounded-full bg-navy/10" />
        <div className="h-5 w-24 rounded-full bg-navy/10" />
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-navy/10" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-navy/10" />
          <div className="h-3 w-20 rounded-full bg-navy/10" />
        </div>
      </div>
      <div className="mt-5 h-[3px] w-10 rounded-full bg-navy/10" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-full rounded-full bg-navy/10" />
        <div className="h-3 w-full rounded-full bg-navy/10" />
        <div className="h-3 w-4/5 rounded-full bg-navy/10" />
      </div>
    </div>
  );
}

function TestimonialCarouselSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <TestimonialCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function TestimonialCarousel({
  testimonials,
}: TestimonialCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="mt-8">
        <Container>
          <TestimonialCarouselSkeleton />
        </Container>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Container>
        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          slidesPerView={1}
          spaceBetween={24}
          loop={testimonials.length > 1}
          speed={700}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            768: {
              slidesPerView: 2,
            },
            1280: {
              slidesPerView: 3,
            },
          }}
        >
          {testimonials.map((testData) => (
            <SwiperSlide key={testData.id}>
              <SingleTestimonial testData={testData} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous testimonial"
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-navy text-navy transition-colors duration-200 hover:bg-navy hover:text-soft"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next testimonial"
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-navy text-white shadow-lg shadow-navy/25 transition-colors duration-200 hover:bg-navy/90"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </Container>
    </div>
  );
}
