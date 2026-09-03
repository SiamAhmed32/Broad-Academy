import { LayoutGrid } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";
import { fetchHomepageCourses } from "@/lib/courses/homepage";
import CourseHeader from "./CourseHeader";
import HomepageCourseShowcase from "./HomepageCourseShowcase";

const CoursePage = async () => {
  const courses = await fetchHomepageCourses(8);

  return (
    <section className="relative overflow-hidden bg-[#f4f7fb] py-14 sm:py-16">
      <Container className="relative">
        <CourseHeader />
        <HomepageCourseShowcase courses={courses} />

        <div className="mt-12 flex justify-center sm:mt-14">
          <Link
            href="/courses"
            className="inline-flex items-center gap-3 rounded-2xl border border-navy/12 bg-white px-7 py-4 text-base font-semibold text-navy shadow-[0_10px_30px_rgba(22,51,81,0.08)] transition hover:-translate-y-0.5 hover:border-navy/25"
          >
            <LayoutGrid className="h-5 w-5 text-navy/70" />
            সব কোর্স দেখুন
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default CoursePage;
