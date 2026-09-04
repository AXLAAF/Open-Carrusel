import { NextResponse } from "next/server";
import { getCarousel, updateCarousel } from "@/lib/carousels";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    caption: carousel.caption || "",
    hashtags: carousel.hashtags || [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { caption, hashtags } = body as {
      caption?: string;
      hashtags?: unknown;
    };
    if (caption !== undefined && typeof caption !== "string") {
      return NextResponse.json({ error: "caption must be a string" }, { status: 400 });
    }
    if (
      hashtags !== undefined &&
      (!Array.isArray(hashtags) || hashtags.some((h) => typeof h !== "string"))
    ) {
      return NextResponse.json({ error: "hashtags must be a string array" }, { status: 400 });
    }

    const updated = await updateCarousel(id, {
      caption,
      hashtags: hashtags as string[] | undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      caption: updated.caption || "",
      hashtags: updated.hashtags || [],
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
