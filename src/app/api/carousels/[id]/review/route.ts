import { NextResponse } from "next/server";
import { getCarousel } from "@/lib/carousels";
import { formatReviewReport, reviewCarousel } from "@/lib/slide-review";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }
  const review = reviewCarousel(carousel);
  return NextResponse.json({
    ...review,
    report: formatReviewReport(review),
  });
}
