import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Layout } from "@/components/Layout";
import { InstructorDetailPage } from "@/components/Instructors";
import {
  fetchInstructorBySlug,
  fetchInstructorSlugs,
} from "@/lib/instructors/fetch";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await fetchInstructorSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchInstructorBySlug(slug);

  if (!data) {
    return { title: "Instructor Not Found | Broad Academy" };
  }

  return {
    title: `${data.instructor.fullName} | Broad Academy`,
    description: data.instructor.shortBio,
    openGraph: {
      title: data.instructor.fullName,
      description: data.instructor.shortBio,
      images: [{ url: data.instructor.avatarUrl }],
    },
  };
}

const InstructorProfilePage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const data = await fetchInstructorBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <Layout>
      <InstructorDetailPage data={data} />
    </Layout>
  );
};

export default InstructorProfilePage;
