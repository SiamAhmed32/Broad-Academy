import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import { LegalPage } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Refund Policy | Broad Academy",
  description:
    "Understand how Broad Academy handles refund requests for paid courses.",
};

const RefundPolicyPage = () => {
  return (
    <Layout>
      <LegalPage slug="refund-policy" />
    </Layout>
  );
};

export default RefundPolicyPage;
