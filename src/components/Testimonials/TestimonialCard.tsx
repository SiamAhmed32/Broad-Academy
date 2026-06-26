"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import { testimonialData } from "../data/testimonialData";
import type { TestimonialItem } from "../data/testimonialData";
import { Container } from "../reusables";
import SingleTestimonial from "./SingleTestimonial";

import "swiper/css";

const TestimonialCard = () => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(testimonialData);

  useEffect(() => {
    let mounted = true;

    async function loadTestimonials() {
      try {
        const response = await fetch("/api/testimonials", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          data?: { testimonials?: TestimonialItem[] };
        } | null;

        if (
          mounted &&
          response.ok &&
          payload?.success &&
          payload.data?.testimonials?.length
        ) {
          setTestimonials(payload.data.testimonials);
        }
      } catch {
        // Keep the curated fallback testimonials if the backend is not ready yet.
      }
    }

    void loadTestimonials();

    return () => {
      mounted = false;
    };
  }, []);

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
          loop={true}
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
};

export default TestimonialCard;
