import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/templates";
import { createCarousel, addSlide, deleteCarousel } from "@/lib/carousels";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const carousel = await createCarousel(
    `${template.name} (from template)`,
    template.aspectRatio
  );

  try {
    for (const slide of template.slides) {
      await addSlide(carousel.id, slide.html, slide.notes);
    }
  } catch (err) {
    await deleteCarousel(carousel.id);
    throw err;
  }

  return NextResponse.json(carousel, { status: 201 });
}
