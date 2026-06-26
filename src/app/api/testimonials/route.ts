import { NextResponse } from "next/server";

import { fetchPublishedTestimonials } from "@/lib/testimonials/fetch";

export async function GET() {
  const testimonials = await fetchPublishedTestimonials();

  return NextResponse.json(
    { success: true, data: { testimonials } },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    },
  );
}
