import React from "react";

import { fetchPublishedTestimonials } from "@/lib/testimonials/fetch";
import { testimonialData } from "../data/testimonialData";
import TestimonialHeader from "./TestimonialHeader";
import TestimonialCarousel from "./TestimonialCarousel";

const TestimonialSection = async () => {
  let testimonials = testimonialData;

  try {
    const published = await fetchPublishedTestimonials();
    if (published.length > 0) {
      testimonials = published;
    }
  } catch {
    // Keep curated fallback testimonials when the database is unavailable.
  }

  return (
    <div>
      <TestimonialHeader />
      <TestimonialCarousel testimonials={testimonials} />
    </div>
  );
};

export default TestimonialSection;
