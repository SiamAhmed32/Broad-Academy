import dynamic from "next/dynamic";

import { HeroPage } from "./Hero";
// import CategoryPage from "./CategorySection/CategoryPage";
import { CoursePage } from "./CourseSection";
import { StatsSection } from "./StatsSection";
import { TestimonialSection } from "../Testimonials";

const ConsultationPage = dynamic(
  () => import("../ConsultationSection/ConsultationPage"),
  { loading: () => <section className="min-h-48" aria-hidden /> },
);

const ContactSection = dynamic(
  () => import("../Contact/ContactSection").then((mod) => mod.default),
  { loading: () => <section className="min-h-48" aria-hidden /> },
);

const Homepage = async () => {
  return (
    <div>
      <HeroPage />
      <StatsSection />
      {/* <CategoryPage /> */}
      <CoursePage />
      <ConsultationPage />
      <TestimonialSection />
      <ContactSection />
    </div>
  );
};

export default Homepage;
