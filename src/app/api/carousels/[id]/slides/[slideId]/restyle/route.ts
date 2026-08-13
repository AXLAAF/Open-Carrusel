import { NextResponse } from "next/server";
import { getCarousel, updateSlide } from "@/lib/carousels";
import { getBrand } from "@/lib/brand";
import { restyleHtml } from "@/lib/slide-fields";
import { isLayoutId } from "@/types/layout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  const { id, slideId } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }
  const slide = carousel.slides.find((s) => s.id === slideId);
  if (!slide) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  let layout: string | undefined;
  try {
    const body = await request.json();
    layout = body?.layout;
  } catch {
    layout = undefined;
  }

  const brand = await getBrand();
  const html = restyleHtml(
    slide.html,
    brand,
    carousel.aspectRatio,
    layout && isLayoutId(layout) ? layout : null
  );
  const updated = await updateSlide(id, slideId, { html });
  return NextResponse.json(updated);
}
