import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";

export type PublicTestimonial = {
  id: string;
  name: string;
  identity: string;
  review: string;
  image: string;
  rating: number;
};

export const fetchPublishedTestimonials = unstable_cache(
  async (): Promise<PublicTestimonial[]> =>
    db.$queryRaw<PublicTestimonial[]>`
      SELECT
        "id",
        "fullName" AS "name",
        "identity",
        "review",
        "imageUrl" AS "image",
        "rating"
      FROM "Testimonial"
      WHERE "status" = ${"PUBLISHED"}::"TestimonialStatus"
      ORDER BY "featured" DESC, "displayOrder" ASC, "createdAt" DESC
      LIMIT 24
    `,
  ["published-testimonials"],
  { revalidate: 120, tags: ["testimonials"] },
);
