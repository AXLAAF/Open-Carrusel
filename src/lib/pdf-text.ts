/**
 * Lightweight PDF text extraction (no extra deps).
 * Works for many text PDFs; FlateDecode streams via zlib.
 * Falls back to empty string when the PDF is image-only or encrypted.
 */

import { inflateSync, gunzipSync } from "zlib";

function decodePdfString(raw: string): string {
  let s = raw;
  if (s.startsWith("(") && s.endsWith(")")) s = s.slice(1, -1);
  s = s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    );
  return s;
}

function extractFromContent(content: string): string {
  const parts: string[] = [];
  // (...) Tj
  for (const m of content.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    const str = m[0].replace(/\s*Tj$/, "");
    parts.push(decodePdfString(str));
  }
  // [(...)...] TJ
  for (const m of content.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    for (const piece of m[1].matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      parts.push(decodePdfString(piece[0]));
    }
  }
  return parts.join(" ");
}

function tryInflate(data: Buffer): Buffer | null {
  try {
    return inflateSync(data);
  } catch {
    try {
      return gunzipSync(data);
    } catch {
      return null;
    }
  }
}

/** Extract readable text from a PDF buffer. */
export function extractPdfText(buffer: Buffer): string {
  const src = buffer.toString("latin1");
  if (!src.startsWith("%PDF")) {
    throw new Error("Not a PDF file");
  }

  const chunks: string[] = [];

  // Uncompressed streams
  for (const m of src.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const body = m[1];
    // Heuristic: if looks binary/deflate, try inflate
    const asBuf = Buffer.from(body, "latin1");
    const inflated = tryInflate(asBuf);
    const content = inflated ? inflated.toString("utf8") : body;
    const text = extractFromContent(content);
    if (text.trim()) chunks.push(text);
  }

  // Also scan whole file for Tj operators (uncompressed PDFs)
  if (chunks.length === 0) {
    const direct = extractFromContent(src);
    if (direct.trim()) chunks.push(direct);
  }

  return chunks
    .join("\n")
    .replace(/\s+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}
