"use client";

import { useRef } from "react";
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

export default function TestimonialCarousel({
  testimonials,
}: TestimonialCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);

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
