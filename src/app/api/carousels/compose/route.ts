import { NextResponse } from "next/server";
import { composeCarousel } from "@/lib/compose";
import type { CarouselBrief } from "@/types/layout";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CarouselBrief;
    const carousel = await composeCarousel(body);
    return NextResponse.json(carousel, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "name is required" ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
