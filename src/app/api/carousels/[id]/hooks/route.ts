import { NextResponse } from "next/server";
import { getCarousel, updateCarousel, updateSlide } from "@/lib/carousels";
import { generateHookVariants } from "@/lib/hook-variants";
import {
  extractFields,
  fieldsToSlideFields,
  readLayout,
  setFieldText,
} from "@/lib/slide-fields";

function findHookSlide(
  carousel: NonNullable<Awaited<ReturnType<typeof getCarousel>>>
) {
  const byLayout = carousel.slides.find((s) => readLayout(s.html) === "hook");
  if (byLayout) return byLayout;
  const byNotes = carousel.slides.find((s) => /hook/i.test(s.notes || ""));
  return byNotes || carousel.slides[0] || null;
}

/** Generate 3 A/B hook variants (persisted on the carousel). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let titleOverride: string | undefined;
  let bodyOverride: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.title === "string") titleOverride = body.title;
    if (typeof body?.body === "string") bodyOverride = body.body;
    if (Array.isArray(body?.titles) && body.titles.length >= 3) {
      const variants = (body.titles as unknown[])
        .slice(0, 3)
        .map((t, i) => ({
          id: crypto.randomUUID(),
          style: (["question", "bold", "stat"] as const)[i],
          title: String(t).trim(),
          body: bodyOverride,
        }))
        .filter((v) => v.title);
      if (variants.length === 3) {
        const updated = await updateCarousel(id, {
          hookVariants: variants,
          activeHookVariantId: null,
        });
        return NextResponse.json({
          ok: true,
          variants,
          activeHookVariantId: null,
          carousel: updated,
        });
      }
    }
  } catch {
    // empty body ok
  }

  const hook = findHookSlide(carousel);
  if (!hook) {
    return NextResponse.json(
      { error: "No slides to derive a hook from" },
      { status: 400 }
    );
  }
  const fields = fieldsToSlideFields(extractFields(hook.html));
  const variants = generateHookVariants({
    title: titleOverride || fields.title,
    body: bodyOverride || fields.body,
    topic: carousel.name,
  });

  const updated = await updateCarousel(id, {
    hookVariants: variants,
    activeHookVariantId: null,
  });
  return NextResponse.json({
    ok: true,
    variants,
    activeHookVariantId: null,
    carousel: updated,
  });
}

/**
 * Apply one persisted variant to the hook slide.
 * Variants stay stored so you can switch anytime.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { index?: number; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const variants = carousel.hookVariants || [];
  if (variants.length === 0) {
    return NextResponse.json(
      { error: "No hook variants — genera 3 primero" },
      { status: 400 }
    );
  }

  let chosen =
    typeof body.id === "string"
      ? variants.find((v) => v.id === body.id)
      : undefined;
  if (!chosen && typeof body.index === "number") {
    chosen = variants[body.index];
  }
  if (!chosen) {
    return NextResponse.json(
      { error: "Pick index 0–2 or a variant id" },
      { status: 400 }
    );
  }

  const hook = findHookSlide(carousel);
  if (!hook) {
    return NextResponse.json({ error: "No hook slide" }, { status: 400 });
  }

  let html = setFieldText(hook.html, "title", chosen.title);
  if (chosen.body) html = setFieldText(html, "body", chosen.body);
  await updateSlide(id, hook.id, { html });
  await updateCarousel(id, {
    hookVariants: variants,
    activeHookVariantId: chosen.id,
  });
  const fresh = await getCarousel(id);
  return NextResponse.json({
    ok: true,
    picked: chosen,
    activeHookVariantId: chosen.id,
    slideId: hook.id,
    variants,
    carousel: fresh,
  });
}

/** List current variants + active selection. */
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
    variants: carousel.hookVariants || [],
    activeHookVariantId: carousel.activeHookVariantId || null,
  });
}
