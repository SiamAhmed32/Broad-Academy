import type { CourseItem } from "@/components/data/CoursesData";
import CourseCard from "@/components/reusables/CourseCard";
import React from "react";

type CoursesProps = {
  courses: CourseItem[];
};

const Courses = ({ courses }: CoursesProps) => {
  return (
    <div className="mt-10 grid gap-6 items-center justify-center md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default Courses;
