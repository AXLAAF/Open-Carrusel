import { NextResponse } from "next/server";
import archiver from "archiver";
import { getCarousel } from "@/lib/carousels";
import {
  exportAllSlides,
  type ExportFormat,
  type ExportNaming,
} from "@/lib/export-slides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ExportBody {
  slideIds?: string[];
  format?: ExportFormat;
  quality?: number;
  naming?: ExportNaming;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);

  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  if (carousel.slides.length === 0) {
    return NextResponse.json({ error: "No slides to export" }, { status: 400 });
  }

  let options: ExportBody = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      options = (await request.json()) as ExportBody;
    } catch {
      options = {};
    }
  }

  const format = options.format === "jpg" ? "jpg" : "png";
  const naming = options.naming === "id" || options.naming === "name" ? options.naming : "index";
  const quality = options.quality;
  const wanted = Array.isArray(options.slideIds) ? new Set(options.slideIds) : null;
  const slides = wanted
    ? carousel.slides.filter((s) => wanted.has(s.id))
    : carousel.slides;

  if (slides.length === 0) {
    return NextResponse.json({ error: "No matching slides" }, { status: 400 });
  }

  try {
    const files = await exportAllSlides(slides, carousel.aspectRatio, undefined, {
      format,
      quality,
      naming,
      carouselName: carousel.name,
    });

    if (files.length === 1) {
      const file = files[0];
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      return new Response(new Uint8Array(file.buffer), {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="${file.name}"`,
        },
      });
    }

    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 5 } });
      const chunks: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on("error", (err) => {
        reject(err);
      });

      try {
        for (const { name, buffer } of files) {
          archive.append(buffer, { name });
        }
        archive.finalize();
      } catch (err) {
        archive.destroy();
        reject(err);
      }
    });

    const zipName = `carousel-${carousel.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.zip`;
    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Export failed: ${message}` },
      { status: 500 }
    );
  }
}
