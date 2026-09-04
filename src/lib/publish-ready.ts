import type { Carousel, PublishStatus } from "@/types/carousel";
import { readLayout } from "@/lib/slide-fields";

export interface PublishCheck {
  id: string;
  ok: boolean;
  label: string;
}

export function getPublishChecks(carousel: Carousel): PublishCheck[] {
  const first = carousel.slides[0];
  const last = carousel.slides[carousel.slides.length - 1];
  const firstLayout = first ? readLayout(first.html) : null;
  const lastLayout = last ? readLayout(last.html) : null;
  const hashtags = carousel.hashtags || [];

  return [
    {
      id: "slides",
      ok: carousel.slides.length >= 5 && carousel.slides.length <= 10,
      label: `${carousel.slides.length} diapositivas (ideal 5–10)`,
    },
    {
      id: "hook",
      ok: firstLayout === "hook" || /hook/i.test(first?.notes || ""),
      label: "La primera es un hook",
    },
    {
      id: "cta",
      ok: lastLayout === "cta" || /cta/i.test(last?.notes || ""),
      label: "La última es un CTA",
    },
    {
      id: "caption",
      ok: Boolean(carousel.caption?.trim()),
      label: "Caption escrito",
    },
    {
      id: "hashtags",
      ok: hashtags.length >= 3,
      label: `${hashtags.length} hashtags (mín. 3)`,
    },
    {
      id: "export",
      ok: Boolean(carousel.lastExportAt),
      label: carousel.lastExportAt
        ? `Export listo (${new Date(carousel.lastExportAt).toLocaleString()})`
        : "Export PNG/JPG pendiente",
    },
  ];
}

export function isContentReady(carousel: Carousel): boolean {
  const checks = getPublishChecks(carousel);
  return checks
    .filter((c) => c.id !== "export")
    .every((c) => c.ok);
}

export function isQueueReady(carousel: Carousel): boolean {
  return getPublishChecks(carousel).every((c) => c.ok);
}

export function resolvePublishStatus(carousel: Carousel): PublishStatus {
  if (carousel.publishStatus === "published") return "published";
  if (carousel.scheduledAt && carousel.publishStatus === "scheduled") {
    return "scheduled";
  }
  if (isQueueReady(carousel) || carousel.publishStatus === "ready") {
    if (isQueueReady(carousel)) return carousel.scheduledAt ? "scheduled" : "ready";
  }
  return carousel.publishStatus || "draft";
}

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  draft: "Borrador",
  ready: "Listo",
  scheduled: "Programado",
  published: "Publicado",
};
