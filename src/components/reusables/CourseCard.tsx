import type { CourseItem } from "@/components/data/CoursesData";
import { ArrowRight, Bookmark, Clock } from "lucide-react";
import Image from "next/image";
import React from "react";
import PrimaryButton from "./PrimaryButton";

type CourseCardProps = {
  course: CourseItem;
};

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <>
      <div className="flex flex-col gap-6 bg-white h-[600px] px-4 py-6 w-[400px] shadow-md rounded-lg hover:outline-1 hover:outline-navy">
        {/* //image part */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={course.img}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
        <h3 className="line-clamp-2 min-h-[4rem] text-2xl font-semibold leading-snug text-navy ">
          {course.title}
        </h3>
        {/* border dashed */}
        <div className="border-t border-dashed border-navy/80" />

        {/* lessons and duration */}
        <div className="flex justify-between">
          <div className="flex gap-2 justify-center items-center text-gray-500 font-medium">
            <Bookmark className="h-5 w-5" />
            <span>{course.chapters} Chapters</span>
          </div>
          <div className="flex gap-2 justify-center items-center text-gray-500 font-medium">
            <Clock className="h-5 w-5" />
            <span>{course.time.split(" ")[0]} h</span>
          </div>
        </div>

        {/* border dashed */}
        <div className="mb-3 border-t border-dashed border-navy/80" />
        {/* cta options */}
        <div>
          <div className="flex justify-between items-center">
            {/* button */}
            <PrimaryButton className="bg-btnBg text-soft hover:bg-btnBg/80">
              <span className="flex justify-center items-center gap-2">
                Enroll Now
                <ArrowRight className="w-5 h-5 " />
              </span>
            </PrimaryButton>

            {/* price */}
            <div className="font-medium text-[18px] font-semibold text-navy">{course.price} TK</div>
          </div>
        </div>
        <div></div>
      </div>
    </>
  );
};

export default CourseCard;
