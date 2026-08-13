import type { AspectRatio } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";
import type { LayoutId, SlideFields } from "@/types/layout";
import { isLayoutId } from "@/types/layout";
import { renderLayout } from "@/lib/slide-layouts";

export interface OcField {
  name: string;
  tag: string;
  inner: string;
  text: string;
  style: Record<string, string>;
  hidden: boolean;
}

export interface OcLayer {
  name: string;
  hidden: boolean;
}

function decode(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export function parseStyle(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of style.split(";")) {
    const i = part.indexOf(":");
    if (i === -1) continue;
    const key = part.slice(0, i).trim().toLowerCase();
    const val = part.slice(i + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

export function serializeStyle(style: Record<string, string>): string {
  return Object.entries(style)
    .filter(([, v]) => v != null && String(v).length > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

function findOpenTag(html: string, attrNeedle: string): { start: number; end: number; tag: string } | null {
  const attrAt = html.indexOf(attrNeedle);
  if (attrAt === -1) return null;
  const start = html.lastIndexOf("<", attrAt);
  if (start === -1) return null;
  const end = html.indexOf(">", attrAt);
  if (end === -1) return null;
  const tagMatch = html.slice(start + 1, end).match(/^([a-zA-Z0-9-]+)/);
  if (!tagMatch) return null;
  return { start, end: end + 1, tag: tagMatch[1].toLowerCase() };
}

function findElement(html: string, attrNeedle: string) {
  const open = findOpenTag(html, attrNeedle);
  if (!open) return null;
  const openInner = html.slice(open.start, open.end);
  if (openInner.endsWith("/>") || ["img", "br", "hr", "input"].includes(open.tag)) {
    return { ...open, innerStart: open.end, innerEnd: open.end, closeEnd: open.end };
  }
  const closeToken = `</${open.tag}>`;
  let depth = 1;
  let cursor = open.end;
  const openToken = `<${open.tag}`;
  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf(openToken, cursor);
    const nextClose = html.indexOf(closeToken, cursor);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose && /[>\s]/.test(html[nextOpen + openToken.length] || ">")) {
      depth += 1;
      cursor = nextOpen + openToken.length;
    } else {
      depth -= 1;
      if (depth === 0) {
        return {
          ...open,
          innerStart: open.end,
          innerEnd: nextClose,
          closeEnd: nextClose + closeToken.length,
        };
      }
      cursor = nextClose + closeToken.length;
    }
  }
  return { ...open, innerStart: open.end, innerEnd: open.end, closeEnd: open.end };
}

function attr(openTag: string, name: string): string | null {
  const re = new RegExp(`${name}="([^"]*)"`, "i");
  return openTag.match(re)?.[1] ?? null;
}

function setAttr(openTag: string, name: string, value: string): string {
  const re = new RegExp(`${name}="[^"]*"`, "i");
  if (re.test(openTag)) return openTag.replace(re, `${name}="${value}"`);
  return openTag.replace(/>$/, ` ${name}="${value}">`);
}

function removeAttr(openTag: string, name: string): string {
  return openTag.replace(new RegExp(`\\s*${name}="[^"]*"`, "i"), "");
}

export function extractFields(html: string): OcField[] {
  const names = [...html.matchAll(/data-oc-field="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set<string>();
  const fields: OcField[] = [];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    const el = findElement(html, `data-oc-field="${name}"`);
    if (!el) continue;
    const openTag = html.slice(el.start, el.end);
    const inner = html.slice(el.innerStart, el.innerEnd);
    const style = parseStyle(attr(openTag, "style") || "");
    fields.push({
      name,
      tag: el.tag,
      inner,
      text: decode(inner),
      style,
      hidden: attr(openTag, "data-oc-hidden") === "true" || style.display === "none",
    });
  }
  return fields;
}

export function listLayers(html: string): OcLayer[] {
  const names = [...html.matchAll(/data-oc-layer="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set<string>();
  const layers: OcLayer[] = [];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    const el = findElement(html, `data-oc-layer="${name}"`);
    if (!el) continue;
    const openTag = html.slice(el.start, el.end);
    const style = parseStyle(attr(openTag, "style") || "");
    layers.push({
      name,
      hidden: attr(openTag, "data-oc-hidden") === "true" || style.display === "none",
    });
  }
  return layers;
}

export function readLayout(html: string): LayoutId | null {
  const match = html.match(/data-oc-layout="([^"]+)"/);
  if (match && isLayoutId(match[1])) return match[1];
  return null;
}

export function fieldsToSlideFields(fields: OcField[]): SlideFields {
  const map = Object.fromEntries(fields.map((f) => [f.name, f.text])) as Record<string, string>;
  const items: string[] = [];
  for (let i = 1; i <= 6; i++) {
    if (map[`item-${i}`] != null) items.push(map[`item-${i}`]);
  }
  return {
    kicker: map.kicker,
    title: map.title,
    body: map.body,
    footer: map.footer,
    quote: map.quote,
    author: map.author,
    stat: map.stat,
    label: map.label,
    items: items.length ? items : undefined,
  };
}

function replaceElement(
  html: string,
  needle: string,
  patch: { inner?: string; openTag?: (tag: string) => string }
): string {
  const el = findElement(html, needle);
  if (!el) return html;
  const openTag = html.slice(el.start, el.end);
  const nextOpen = patch.openTag ? patch.openTag(openTag) : openTag;
  const inner = patch.inner != null ? patch.inner : html.slice(el.innerStart, el.innerEnd);
  const close = html.slice(el.innerEnd, el.closeEnd);
  return html.slice(0, el.start) + nextOpen + inner + close + html.slice(el.closeEnd);
}

export function setFieldText(html: string, field: string, text: string): string {
  const inner = escapeInner(text);
  return replaceElement(html, `data-oc-field="${field}"`, { inner });
}

export function setFieldStyle(html: string, field: string, patch: Record<string, string>): string {
  return replaceElement(html, `data-oc-field="${field}"`, {
    openTag: (open) => {
      const style = parseStyle(attr(open, "style") || "");
      Object.assign(style, patch);
      return setAttr(open, "style", serializeStyle(style));
    },
  });
}

export function setLayerHidden(html: string, name: string, hidden: boolean): string {
  return replaceElement(html, `data-oc-layer="${name}"`, {
    openTag: (open) => {
      const style = parseStyle(attr(open, "style") || "");
      if (hidden) {
        style.display = "none";
        return setAttr(setAttr(open, "style", serializeStyle(style)), "data-oc-hidden", "true");
      }
      delete style.display;
      return setAttr(removeAttr(open, "data-oc-hidden"), "style", serializeStyle(style));
    },
  });
}

export function moveLayer(html: string, name: string, direction: -1 | 1): string {
  const layers = listLayers(html).map((l) => l.name);
  const index = layers.indexOf(name);
  const swapWith = layers[index + direction];
  if (index === -1 || !swapWith) return html;
  const a = findElement(html, `data-oc-layer="${name}"`);
  const b = findElement(html, `data-oc-layer="${swapWith}"`);
  if (!a || !b) return html;
  const first = a.start < b.start ? a : b;
  const second = a.start < b.start ? b : a;
  if (first.closeEnd > second.start) return html;
  const firstHtml = html.slice(first.start, first.closeEnd);
  const secondHtml = html.slice(second.start, second.closeEnd);
  return (
    html.slice(0, first.start) +
    secondHtml +
    html.slice(first.closeEnd, second.start) +
    firstHtml +
    html.slice(second.closeEnd)
  );
}

export function getRootStyle(html: string): Record<string, string> {
  const el =
    findOpenTag(html, `data-oc-layout="`) || findOpenTag(html, `class="oc-slide"`) || findOpenTag(html, "<div");
  if (!el) return {};
  return parseStyle(attr(html.slice(el.start, el.end), "style") || "");
}

export function setRootStyle(html: string, patch: Record<string, string>): string {
  const el =
    findOpenTag(html, `data-oc-layout="`) || findOpenTag(html, `class="oc-slide"`);
  if (!el) return html;
  const open = html.slice(el.start, el.end);
  const style = { ...parseStyle(attr(open, "style") || ""), ...patch };
  const next = setAttr(open, "style", serializeStyle(style));
  return html.slice(0, el.start) + next + html.slice(el.end);
}

function escapeInner(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function injectOnTag(html: string, tagRe: RegExp, field: string): string {
  if (html.includes(`data-oc-field="${field}"`)) return html;
  return html.replace(tagRe, (full) => {
    if (full.includes("data-oc-field=")) return full;
    return full.replace(/>$/, ` data-oc-field="${field}" data-oc-layer="${field}">`);
  });
}

export function ensureEditable(html: string): string {
  if (html.includes("data-oc-field=")) return html;
  let out = html;
  out = injectOnTag(out, /<h1\b[^>]*>/i, "title");
  out = injectOnTag(out, /<p\b[^>]*class="[^"]*xook-tag[^"]*"[^>]*>/i, "kicker");
  out = injectOnTag(out, /<div\b[^>]*class="[^"]*xook-tag[^"]*"[^>]*>/i, "kicker");
  out = injectOnTag(out, /<p\b[^>]*class="[^"]*xook-body[^"]*"[^>]*>/i, "body");
  out = injectOnTag(out, /<p\b[^>]*class="[^"]*xook-logo[^"]*"[^>]*>/i, "footer");
  out = injectOnTag(out, /<div\b[^>]*class="[^"]*xook-logo[^"]*"[^>]*>/i, "footer");
  if (!out.includes('data-oc-field="body"')) {
    out = injectOnTag(out, /<p\b[^>]*>/i, "body");
  }
  if (!out.includes("data-oc-layout=")) {
    out = out.replace(/<div\b/i, '<div data-oc-layout="value" class="oc-slide"');
  }
  return out;
}

export function restyleHtml(
  html: string,
  brand: BrandConfig,
  ratio: AspectRatio,
  layout?: LayoutId | null
): string {
  const editable = ensureEditable(html);
  const nextLayout = layout || readLayout(editable) || "value";
  const fields = fieldsToSlideFields(extractFields(editable));
  return renderLayout(nextLayout, fields, brand, ratio);
}
