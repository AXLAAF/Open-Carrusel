import { readFile } from "fs/promises";
import path from "path";

const PUBLIC_FONTS = path.resolve(process.cwd(), "public", "fonts");

const EXPORT_FONTS = [
  { family: "Borscha", file: "Borscha-Regular.ttf", weight: 400, style: "normal" },
  { family: "Borscha", file: "Borscha-Bold.ttf", weight: 700, style: "normal" },
  { family: "Borscha", file: "Borscha-Black.ttf", weight: 900, style: "normal" },
  { family: "BorschaBold", file: "Borscha-Bold.ttf", weight: 700, style: "normal" },
  { family: "BorschaRegular", file: "Borscha-Regular.ttf", weight: 400, style: "normal" },
  { family: "Rostex", file: "Rostex-Regular.ttf", weight: 400, style: "normal" },
  { family: "Rostex", file: "Rostex-Oblique.ttf", weight: 400, style: "italic" },
  { family: "RostexRegular", file: "Rostex-Regular.ttf", weight: 400, style: "normal" },
] as const;

/**
 * Base64 @font-face CSS for Puppeteer export (no network, no CORS).
 */
export async function getInlinedLocalFontCSS(): Promise<string> {
  const parts: string[] = [];

  for (const font of EXPORT_FONTS) {
    try {
      const buf = await readFile(path.join(PUBLIC_FONTS, font.file));
      const b64 = buf.toString("base64");
      parts.push(
        `@font-face{font-family:"${font.family}";src:url(data:font/truetype;base64,${b64}) format("truetype");font-weight:${font.weight};font-style:${font.style};font-display:block;}`
      );
    } catch {
      // Font file missing — skip
    }
  }

  return parts.join("\n");
}

