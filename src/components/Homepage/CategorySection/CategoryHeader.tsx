import React from "react";

const CategoryHeader = () => {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Explore by Class
      </p>
      <h2 className="mt-3 text-4xl font-semibold text-navy">
        Learning Categories for Class 6 to 12
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Start with the class level that matches your current academic journey
        and explore focused subjects, lessons, and guided preparation.
      </p>
    </div>
  );
};

export default CategoryHeader;
