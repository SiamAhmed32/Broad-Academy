import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";
import { fetchHomepageCourses } from "@/lib/courses/homepage";
import CourseHeader from "./CourseHeader";
import HomepageCourseShowcase from "./HomepageCourseShowcase";

const CoursePage = async () => {
  const courses = await fetchHomepageCourses(6);

  return (
    <section className="relative overflow-hidden bg-[#f4f7fb] py-14 sm:py-16">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-btnBg/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-navy/5 blur-3xl" />

      <Container className="relative">
        <CourseHeader featuredCount={courses.filter((course) => course.featured).length} />
        <HomepageCourseShowcase courses={courses} />

        <div className="mt-12 flex flex-col items-center gap-3 sm:mt-14">
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2.5 rounded-2xl bg-navy px-7 py-3.5 text-sm font-bold text-white shadow-[0_16px_40px_rgba(22,51,81,0.22)] transition hover:-translate-y-0.5 hover:bg-btnBg"
          >
            Explore all courses
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-navy/50">
            <BookOpen className="h-3.5 w-3.5" />
            Structured lessons from Class 6 to HSC
          </p>
        </div>
      </Container>
    </section>
  );
};

export default CoursePage;
