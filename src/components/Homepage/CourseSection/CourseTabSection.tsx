"use client";

import { tabCategories, type CourseTabValue } from "@/components/data/CoursesData";

interface CourseTabSectionProps {
  activeTab: CourseTabValue;
  onTabChange: (value: CourseTabValue) => void;
}

const CourseTabSection = ({
  activeTab,
  onTabChange,
}: CourseTabSectionProps) => {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-4 mx-10 items-center justify-center gap-4  p-4 rounded-lg transition-all duration-300">
        {tabCategories.map((tabCategory) => (
          <button
            key={tabCategory.value}
            onClick={() => onTabChange(tabCategory.value)}
            className={`font-medium text-center  px-4 py-2  cursor-pointer rounded-lg text-navy
                  ${
                    activeTab === tabCategory.value
                      ? "bg-navy text-soft"
                      : "bg-white hover:bg-navy/10"
                  }
                  `}
          >
            {tabCategory.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourseTabSection;
