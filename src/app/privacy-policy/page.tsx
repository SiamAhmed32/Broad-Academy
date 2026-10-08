import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import { LegalPage } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Broad Academy",
  description:
    "Learn how Broad Academy protects student and guardian information.",
};

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <LegalPage slug="privacy-policy" />
    </Layout>
  );
};

export default PrivacyPolicyPage;
