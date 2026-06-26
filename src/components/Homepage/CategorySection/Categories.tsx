import { categoryData } from "@/components/data/categoryData";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { categoryMediaById, categoryToneById } from "./categoryUi";

const getVisibilityClass = (index: number) => {
  if (index < 2) return "";
  if (index < 4) return "hidden md:block";
  if (index < 6) return "hidden xl:block";
  return "hidden";
};

const Categories = () => {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {categoryData.map((item, index) => {
        const accentClass = categoryToneById[item.id] || "bg-soft text-navy";
        const imageMeta = categoryMediaById[item.id];
        const visibilityClass = getVisibilityClass(index);

        return (
          <article
            key={item.id}
            className={`group relative h-[470px] overflow-hidden rounded-[28px] bg-navy shadow-[0_22px_55px_rgba(15,23,42,0.1)] ring-1 ring-navy/8 transition-transform duration-300 hover:-translate-y-1 ${visibilityClass}`}
          >
            {imageMeta ? (
              <Image
                src={imageMeta.src}
                alt={imageMeta.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
            ) : null}

            <div className="absolute inset-0 bg-gradient-to-t from-[#10223a]/98 via-[#10223a]/66 via-52% to-[#10223a]/10" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="space-y-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.08em] ${accentClass}`}
                >
                  {item.subtitle}
                </span>

                <div>
                  <h3 className="text-[2.15rem] font-semibold leading-[0.95] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[26ch] text-[15px] leading-7 text-white/78">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/72">
                  <span>{item.subjectCount} subjects</span>
                  <span className="h-1 w-1 rounded-full bg-white/45" />
                  <span>Guided learning</span>
                </div>
              </div>

              <Link
                href="/"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-white text-[17px] font-semibold text-navy transition-colors duration-200 hover:bg-soft"
              >
                Explore Class
              </Link>
            </div>
          </article>
        );
      })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/classes"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-navy/12 bg-white px-7 text-base font-semibold text-navy shadow-sm transition-colors duration-200 hover:bg-navy/90 hover:text-white"
        >
          View All Classes
        </Link>
      </div>
    </div>
  );
};

export default Categories;
