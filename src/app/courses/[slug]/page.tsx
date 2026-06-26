import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseDetailPage } from "@/components/Courses";
import { Layout } from "@/components/Layout";
import { fetchCourseBySlug, fetchCourseSlugs } from "@/lib/courses/fetch";
import { courseSlugSchema } from "@/lib/courses/validation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await fetchCourseSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = courseSlugSchema.safeParse((await params).slug);
  if (!parsed.success) return { title: "Course Not Found" };

  const data = await fetchCourseBySlug(parsed.data);
  if (!data) return { title: "Course Not Found" };

  return {
    title: data.course.title,
    description: data.course.shortDescription,
    alternates: { canonical: `/courses/${data.course.slug}` },
    openGraph: {
      title: data.course.title,
      description: data.course.shortDescription,
      type: "website",
      images: [{ url: data.course.thumbnailUrl }],
    },
  };
}

export default async function CourseRoute({ params }: PageProps) {
  const parsed = courseSlugSchema.safeParse((await params).slug);
  if (!parsed.success) notFound();

  const data = await fetchCourseBySlug(parsed.data);
  if (!data) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: data.course.title,
    description: data.course.shortDescription,
    provider: { "@type": "Organization", name: "Broad Academy" },
    offers: {
      "@type": "Offer",
      price: data.course.price,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
      url: `/courses/${data.course.slug}`,
    },
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <CourseDetailPage data={data} />
    </Layout>
  );
}
