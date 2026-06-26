import type { Metadata } from "next";

import { ContactPage } from "@/components/Contact";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Contact Us | Broad Academy",
  description:
    "Get in touch with Broad Academy for course enrollment, admissions, and academic support for Class 6 to HSC students.",
};

const ContactRoutePage = () => {
  return (
    <Layout>
      <ContactPage />
    </Layout>
  );
};

export default ContactRoutePage;
