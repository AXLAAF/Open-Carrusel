import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

function getAssetOrigin(override?: string): string {
  if (override) return override.replace(/\/$/, "");
  if (typeof process !== "undefined") {
    const env =
      process.env.OC_ORIGIN ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";
    if (env) return env.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

/**
 * Extract Google Font family names from slide HTML.
 * Looks for font-family declarations in inline styles and <style> tags.
 */
export function extractFontFamilies(html: string): string[] {
  const families = new Set<string>();
  const regex = /font-family:\s*['"]?([^;'"}\n]+?)['"]?\s*[;}"]/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    const generics = new Set([
      "serif",
      "sans-serif",
      "monospace",
      "cursive",
      "fantasy",
      "system-ui",
      "inherit",
      "initial",
      "unset",
    ]);
    const local = new Set([
      "borscha",
      "borschabold",
      "borscharegular",
      "rostex",
      "rostexregular",
      "rostexoblique",
    ]);
    for (const part of raw.split(",")) {
      const name = part.trim().replace(/['"]/g, "");
      if (
        name &&
        !generics.has(name.toLowerCase()) &&
        !local.has(name.toLowerCase())
      ) {
        families.add(name);
      }
    }
  }
  return Array.from(families);
}

export interface WrapSlideOptions {
  inlineFontCss?: string;
  assetOrigin?: string;
}

/**
 * Wraps slide body HTML into a full HTML document at the correct dimensions.
 * This is THE shared rendering contract between preview (iframe) and export (Puppeteer).
 */
export function wrapSlideHtml(
  slideHtml: string,
  aspectRatio: AspectRatio,
  options?: WrapSlideOptions
): string {
  const { width, height } = DIMENSIONS[aspectRatio];
  const fontFamilies = extractFontFamilies(slideHtml);
  const origin = getAssetOrigin(options?.assetOrigin);

  let fontBlock = "";
  if (options?.inlineFontCss) {
    fontBlock = `<style>${options.inlineFontCss}</style>`;
  } else {
    if (fontFamilies.length > 0) {
      const params = fontFamilies
        .map(
          (f) =>
            `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`
        )
        .join("&");
      fontBlock += `<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet">`;
    }
    fontBlock += `<link rel="stylesheet" href="${origin}/fonts/local.css">`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${width}, initial-scale=1">
  ${fontBlock}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #000;
    }

    .forge-slide {
      width: ${width}px;
      height: ${height}px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
      text-align: center;
      position: relative;
      background: linear-gradient(135deg, #1B2B6B 0%, #2D4BD4 50%, #00D4FF 100%);
      color: #FFFFFF;
      overflow: hidden;
    }

    .forge-title {
      font-family: "BorschaBold", "Borscha", sans-serif;
      font-size: 80px;
      text-transform: uppercase;
      line-height: 1.1;
      margin-bottom: 40px;
      text-shadow: 0 0 30px rgba(255,255,255,0.35);
      letter-spacing: -2px;
    }

    .forge-body {
      font-family: "BorschaRegular", "Borscha", sans-serif;
      font-size: 36px;
      line-height: 1.5;
      opacity: 0.95;
      max-width: 800px;
    }

    .forge-tag {
      font-family: "BorschaBold", "Borscha", sans-serif;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(12px);
      padding: 20px 50px;
      border: 3px solid rgba(255,255,255,0.3);
      font-size: 40px;
      margin-bottom: 60px;
      letter-spacing: 8px;
      text-transform: uppercase;
    }

    .forge-logo {
      font-family: "RostexRegular", "Rostex", sans-serif;
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 28px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  ${slideHtml}
</body>
</html>`;
}
