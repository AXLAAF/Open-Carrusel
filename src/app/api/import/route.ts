import { NextResponse } from "next/server";
import {
  importFromPdf,
  importFromText,
  importFromUrl,
} from "@/lib/import-source";
import { composeCarousel } from "@/lib/compose";
import type { AspectRatio } from "@/types/carousel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATIOS: AspectRatio[] = ["1:1", "4:5", "9:16"];

function parseRatio(value: unknown): AspectRatio | undefined {
  return RATIOS.includes(value as AspectRatio)
    ? (value as AspectRatio)
    : undefined;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const compose = form.get("compose") === "true" || form.get("compose") === "1";
      const name = String(form.get("name") || "") || undefined;
      const ratio = parseRatio(form.get("ratio"));
      const url = String(form.get("url") || "").trim();

      if (file instanceof File && file.size > 0) {
        const buf = Buffer.from(await file.arrayBuffer());
        const isPdf =
          file.name.toLowerCase().endsWith(".pdf") ||
          file.type === "application/pdf";
        if (!isPdf) {
          return NextResponse.json(
            { error: "Solo PDF o usa JSON con url/text" },
            { status: 400 }
          );
        }
        const imported = await importFromPdf(buf, {
          name,
          ratio,
          filename: file.name,
        });
        if (compose) {
          const carousel = await composeCarousel(imported.brief);
          return NextResponse.json(
            { ...imported, carousel },
            { status: 201 }
          );
        }
        return NextResponse.json(imported);
      }

      if (url) {
        const imported = await importFromUrl(url, { name, ratio });
        if (compose) {
          const carousel = await composeCarousel(imported.brief);
          return NextResponse.json(
            { ...imported, carousel },
            { status: 201 }
          );
        }
        return NextResponse.json(imported);
      }

      return NextResponse.json(
        { error: "Proporciona file (PDF) o url" },
        { status: 400 }
      );
    }

    let body: {
      url?: string;
      text?: string;
      name?: string;
      ratio?: string;
      compose?: boolean;
      saveBrief?: boolean;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const ratio = parseRatio(body.ratio);
    const compose = Boolean(body.compose);
    const saveBrief = body.saveBrief !== false;

    let imported;
    if (body.url?.trim()) {
      imported = await importFromUrl(body.url.trim(), {
        name: body.name,
        ratio,
        saveBrief,
      });
    } else if (body.text?.trim()) {
      imported = await importFromText(body.text, {
        name: body.name,
        ratio,
        saveBrief,
      });
    } else {
      return NextResponse.json(
        { error: "url o text requerido" },
        { status: 400 }
      );
    }

    if (compose) {
      const carousel = await composeCarousel(imported.brief);
      return NextResponse.json({ ...imported, carousel }, { status: 201 });
    }
    return NextResponse.json(imported);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
