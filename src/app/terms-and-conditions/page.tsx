import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import { LegalPage } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Terms & Conditions | Broad Academy",
  description:
    "Read the rules for using Broad Academy courses, content, and services.",
};

const TermsAndConditionsPage = () => {
  return (
    <Layout>
      <LegalPage slug="terms-and-conditions" />
    </Layout>
  );
};

export default TermsAndConditionsPage;
