import type { Metadata } from "next";

import { AboutPage } from "@/components/About";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: "About Us | Broad Academy",
  description:
    "Learn about Broad Academy — our mission, story, and commitment to helping Bangladeshi students excel from Class 6 through HSC.",
  openGraph: {
    title: "About Broad Academy",
    description:
      "A learning community built on expert mentorship, structured programs, and family-centered support.",
  },
};

const AboutRoutePage = () => {
  return (
    <Layout>
      <AboutPage />
    </Layout>
  );
};

export default AboutRoutePage;
