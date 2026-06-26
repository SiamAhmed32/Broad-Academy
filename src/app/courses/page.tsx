import type { Metadata } from "next";

import { CoursesPage } from "@/components/Courses";
import { Layout } from "@/components/Layout";
import { fetchCourses } from "@/lib/courses/fetch";
import { courseListQuerySchema } from "@/lib/courses/validation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const query = parseCourseSearchParams(await searchParams);
  const title = query.search
    ? `Search courses: ${query.search}`
    : query.category
      ? `${query.category} courses`
      : query.level
        ? `${query.level.replace("-", " ")} courses`
        : "All courses";

  const description =
    "Browse Broad Academy courses by subject and class level. Search structured lessons, exam preparation, and teacher-guided academic programs.";
  const canonicalParams = new URLSearchParams();
  if (query.category) canonicalParams.set("category", query.category);
  if (query.level) canonicalParams.set("level", query.level);
  if (query.page > 1) canonicalParams.set("page", String(query.page));

  return {
    title,
    description,
    alternates: {
      canonical: `/courses${canonicalParams.size ? `?${canonicalParams}` : ""}`,
    },
    robots: query.search ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${title} | Broad Academy`,
      description,
      type: "website",
    },
  };
}

export default async function CoursesRoute({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = parseCourseSearchParams(await searchParams);
  const data = await fetchCourses(query);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Broad Academy courses",
    numberOfItems: data.pagination.total,
    itemListElement: data.courses.map((course, index) => ({
      "@type": "ListItem",
      position: (data.pagination.page - 1) * data.pagination.limit + index + 1,
      item: {
        "@type": "Course",
        name: course.title,
        description: course.shortDescription,
        provider: {
          "@type": "Organization",
          name: "Broad Academy",
        },
      },
    })),
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <CoursesPage data={data} query={query} />
    </Layout>
  );
}

function parseCourseSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const firstValues = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  return courseListQuerySchema.parse(firstValues);
}
