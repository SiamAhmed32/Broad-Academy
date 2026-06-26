import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import { InstructorsPage } from "@/components/Instructors";
import { fetchInstructorsList } from "@/lib/instructors/fetch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Instructors | Broad Academy",
  description:
    "Meet Broad Academy's expert instructors — passionate mentors guiding students to academic excellence.",
};

const InstructorsRoutePage = async () => {
  const initialData = await fetchInstructorsList();

  return (
    <Layout>
      <InstructorsPage initialData={initialData} />
    </Layout>
  );
};

export default InstructorsRoutePage;
