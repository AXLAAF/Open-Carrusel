import { NextResponse } from "next/server";
import {
  getBrandLayout,
  listBrandLayouts,
  reseedBrandLayouts,
} from "@/lib/layout-library";
import {
  getCarousel,
  addSlide,
  updateSlide,
} from "@/lib/carousels";
import { resizeSlideHtml } from "@/lib/slide-fields";
import { brandForCarousel } from "@/lib/brand-resolve";
import { restyleHtml } from "@/lib/slide-fields";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("reseed") === "1") {
    const layouts = await reseedBrandLayouts();
    return NextResponse.json({ layouts, reseeding: true });
  }
  const layouts = await listBrandLayouts();
  return NextResponse.json({ layouts });
}

export async function POST(request: Request) {
  let body: {
    layoutId?: string;
    carouselId?: string;
    slideId?: string;
    mode?: "replace" | "add";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { layoutId, carouselId, slideId } = body;
  const mode = body.mode === "add" ? "add" : "replace";
  if (!layoutId || !carouselId) {
    return NextResponse.json(
      { error: "layoutId and carouselId required" },
      { status: 400 }
    );
  }

  const layout = await getBrandLayout(layoutId);
  if (!layout) {
    return NextResponse.json({ error: "Layout not found" }, { status: 404 });
  }
  const carousel = await getCarousel(carouselId);
  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  const brand = await brandForCarousel(carousel);
  let html = resizeSlideHtml(layout.html, carousel.aspectRatio);
  // Re-apply carousel palette onto the brand layout fields
  html = restyleHtml(html, brand, carousel.aspectRatio, layout.layout);

  if (mode === "add" || !slideId) {
    const slide = await addSlide(carouselId, html, layout.layout);
    if (!slide) {
      return NextResponse.json(
        { error: "Could not add slide (max reached?)" },
        { status: 400 }
      );
    }
    const updated = await getCarousel(carouselId);
    return NextResponse.json({ ok: true, slide, carousel: updated }, { status: 201 });
  }

  const existing = carousel.slides.find((s) => s.id === slideId);
  if (!existing) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }
  const slide = await updateSlide(carouselId, slideId, { html, notes: layout.layout });
  const updated = await getCarousel(carouselId);
  return NextResponse.json({ ok: true, slide, carousel: updated });
}
