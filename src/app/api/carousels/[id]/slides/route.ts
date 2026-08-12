import { NextResponse } from "next/server";
import { addSlide, reorderSlides, getCarousel, duplicateSlide } from "@/lib/carousels";
import { getBrand } from "@/lib/brand";
import { blankSlideHtml } from "@/lib/blank-slide";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { html, notes, blank, duplicateFrom } = body as {
      html?: string;
      notes?: string;
      blank?: boolean;
      duplicateFrom?: string;
    };

    if (duplicateFrom && typeof duplicateFrom === "string") {
      const slide = await duplicateSlide(id, duplicateFrom);
      if (!slide) {
        return NextResponse.json(
          { error: "Slide not found or max slides reached" },
          { status: 400 }
        );
      }
      return NextResponse.json(slide, { status: 201 });
    }

    let slideHtml = html;
    if (blank || !slideHtml) {
      const [brand, carousel] = await Promise.all([
        getBrand(),
        getCarousel(id),
      ]);
      if (!carousel) {
        return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
      }
      slideHtml = blankSlideHtml(carousel.aspectRatio, brand);
    }

    if (typeof slideHtml !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const slide = await addSlide(id, slideHtml, notes);
    if (!slide) {
      return NextResponse.json(
        { error: "Carousel not found or max slides reached" },
        { status: 400 }
      );
    }
    return NextResponse.json(slide, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { slideIds } = body as { slideIds?: string[] };

    if (!Array.isArray(slideIds)) {
      return NextResponse.json(
        { error: "slideIds array is required" },
        { status: 400 }
      );
    }

    const success = await reorderSlides(id, slideIds);
    if (!success) {
      return NextResponse.json(
        { error: "Carousel not found or invalid slide IDs" },
        { status: 400 }
      );
    }

    const carousel = await getCarousel(id);
    return NextResponse.json({ slides: carousel?.slides ?? [] });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
