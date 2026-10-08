import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import { PrivacyPolicy } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Broad Academy",
  description:
    "Learn how Broad Academy protects student and guardian information.",
};

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <PrivacyPolicy />
    </Layout>
  );
};

export default PrivacyPolicyPage;
