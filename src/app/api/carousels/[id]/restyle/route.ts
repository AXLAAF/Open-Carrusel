import { NextResponse } from "next/server";
import { getCarousel, updateSlide } from "@/lib/carousels";
import { brandForCarousel } from "@/lib/brand-resolve";
import { restyleHtml } from "@/lib/slide-fields";
import { isLayoutId } from "@/types/layout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  let layout: string | undefined;
  try {
    const body = await request.json();
    layout = body?.layout;
  } catch {
    layout = undefined;
  }

  const brand = await brandForCarousel(carousel);
  let count = 0;
  for (const slide of carousel.slides) {
    const html = restyleHtml(
      slide.html,
      brand,
      carousel.aspectRatio,
      layout && isLayoutId(layout) ? layout : null
    );
    if (html !== slide.html) {
      await updateSlide(id, slide.id, { html });
      count += 1;
    }
  }

  const updated = await getCarousel(id);
  return NextResponse.json({ ok: true, restyled: count, carousel: updated });
}
