import { NextResponse } from "next/server";
import { getCarousel, updateCarousel, updateSlide } from "@/lib/carousels";
import { brandForCarousel, sanitizePalette } from "@/lib/brand-resolve";
import { restyleHtml } from "@/lib/slide-fields";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const brand = await brandForCarousel(carousel);
  return NextResponse.json({
    palette: carousel.palette ?? null,
    effective: brand.colors,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clear = body.clear === true || body.palette === null;
  const palette = clear
    ? null
    : sanitizePalette(body.palette ?? body) ?? carousel.palette ?? null;

  const apply = body.apply !== false;
  const updated = await updateCarousel(id, { palette });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let restyled = 0;
  if (apply) {
    const brand = await brandForCarousel(updated);
    const fresh = await getCarousel(id);
    if (fresh) {
      for (const slide of fresh.slides) {
        const html = restyleHtml(slide.html, brand, fresh.aspectRatio, null);
        if (html !== slide.html) {
          await updateSlide(id, slide.id, { html });
          restyled += 1;
        }
      }
    }
  }

  const next = await getCarousel(id);
  return NextResponse.json({
    ok: true,
    restyled,
    palette: next?.palette ?? null,
    carousel: next,
  });
}
