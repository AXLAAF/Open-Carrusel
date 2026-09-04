import { NextResponse } from "next/server";
import { listCarousels, getCarousel, updateCarousel } from "@/lib/carousels";
import {
  getPublishChecks,
  isQueueReady,
  resolvePublishStatus,
} from "@/lib/publish-ready";

export async function GET() {
  const carousels = await listCarousels();
  const queue = carousels
    .map((c) => ({
      id: c.id,
      name: c.name,
      aspectRatio: c.aspectRatio,
      slides: c.slides.length,
      caption: Boolean(c.caption?.trim()),
      hashtags: c.hashtags?.length ?? 0,
      scheduledAt: c.scheduledAt ?? null,
      lastExportAt: c.lastExportAt ?? null,
      publishStatus: resolvePublishStatus(c),
      ready: isQueueReady(c),
      checks: getPublishChecks(c),
    }))
    .sort((a, b) => {
      const aTime = a.scheduledAt ? Date.parse(a.scheduledAt) : Number.MAX_SAFE_INTEGER;
      const bTime = b.scheduledAt ? Date.parse(b.scheduledAt) : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return a.name.localeCompare(b.name);
    });

  return NextResponse.json({ queue });
}

export async function PUT(request: Request) {
  let body: {
    carouselId?: string;
    scheduledAt?: string | null;
    publishStatus?: string;
    clear?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.carouselId;
  if (!id) {
    return NextResponse.json({ error: "carouselId required" }, { status: 400 });
  }

  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.clear) {
    const updated = await updateCarousel(id, {
      scheduledAt: null,
      publishStatus: isQueueReady(carousel) ? "ready" : "draft",
    });
    return NextResponse.json({ ok: true, carousel: updated });
  }

  const patch: Record<string, unknown> = {};
  if ("scheduledAt" in body) {
    patch.scheduledAt = body.scheduledAt;
    if (body.scheduledAt) {
      patch.publishStatus = "scheduled";
    }
  }
  if (
    body.publishStatus === "draft" ||
    body.publishStatus === "ready" ||
    body.publishStatus === "scheduled" ||
    body.publishStatus === "published"
  ) {
    if (body.publishStatus === "ready" && !isQueueReady(carousel)) {
      return NextResponse.json(
        {
          error: "Completa caption, hashtags, arco y export antes de marcar listo",
          checks: getPublishChecks(carousel),
        },
        { status: 400 }
      );
    }
    patch.publishStatus = body.publishStatus;
  }

  const updated = await updateCarousel(id, patch);
  return NextResponse.json({
    ok: true,
    carousel: updated,
    status: updated ? resolvePublishStatus(updated) : null,
    ready: updated ? isQueueReady(updated) : false,
  });
}
