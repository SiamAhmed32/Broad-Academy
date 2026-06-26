"use client";

import { forwardRef, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import CourseCard from "@/components/Courses/CourseCard";
import type { PublicCourse } from "@/lib/courses/types";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/pagination";

type HomepageCourseShowcaseProps = {
  courses: PublicCourse[];
};

const CarouselButton = forwardRef<
  HTMLButtonElement,
  { direction: "prev" | "next" }
>(function CarouselButton({ direction }, ref) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={direction === "prev" ? "Previous course" : "Next course"}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-navy/10 bg-white text-navy shadow-[0_10px_30px_rgba(22,51,81,0.12)] transition",
        "hover:border-btnBg/5 hover:bg-btnBg/5 hover:text-btnBg active:scale-95",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
});

export default function HomepageCourseShowcase({
  courses,
}: HomepageCourseShowcaseProps) {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  if (!courses.length) {
    return (
      <div className="mt-10 rounded-[1.75rem] border border-dashed border-navy/15 bg-white/70 px-6 py-16 text-center">
        <p className="text-lg font-semibold text-navy">Courses coming soon</p>
        <p className="mt-2 text-sm text-navy/60">
          Featured programs will appear here once published.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course, index) => (
          <CourseCard key={course.id} course={course} index={index} />
        ))}
      </div>

      <div className="relative mt-8 md:hidden">
        <Swiper
          className="homepage-course-swiper !overflow-visible pb-2"
          modules={[Autoplay, Navigation, Pagination]}
          slidesPerView={1.06}
          centeredSlides
          spaceBetween={16}
          loop={courses.length > 1}
          speed={650}
          autoplay={{
            delay: 4200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          onBeforeInit={(swiper: SwiperType) => {
            if (
              typeof swiper.params.navigation !== "boolean" &&
              swiper.params.navigation
            ) {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }
          }}
          onSwiper={(swiper) => {
            window.setTimeout(() => {
              if (
                typeof swiper.params.navigation !== "boolean" &&
                swiper.params.navigation
              ) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }
            }, 0);
          }}
        >
          {courses.map((course, index) => (
            <SwiperSlide key={course.id} className="!h-auto">
              <CourseCard course={course} index={index} variant="carousel" />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="mt-6 flex items-center justify-center gap-3 px-1">
          <CarouselButton ref={prevRef} direction="prev" />
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.14em] text-navy/40">
            Featured courses
          </p>
          <CarouselButton ref={nextRef} direction="next" />
        </div>
      </div>
    </>
  );
}
