/**
 * Markdown brief → compose object.
 *
 *   # Name
 *   Ratio: 4:5
 *   CTA: Guarda esto
 *
 *   ## Topic
 *   ## Points
 *   ## Caption
 *   ## Hashtags
 *   ## Slides
 *   ### hook
 *   title: ...
 */

const LAYOUTS = new Set([
  "hook",
  "setup",
  "value",
  "list",
  "quote",
  "stat",
  "summary",
  "cta",
]);

function applyKey(brief, key, value) {
  const k = String(key).toLowerCase().trim();
  const v = String(value ?? "").trim();
  if (!v) return;
  if (k === "name" || k === "nombre") brief.name = v;
  else if (k === "topic" || k === "tema") brief.topic = v;
  else if (k === "cta") brief.cta = v;
  else if (k === "kicker") brief.kicker = v;
  else if (k === "footer" || k === "pie") brief.footer = v;
  else if (k === "caption" || k === "texto") brief.caption = v;
  else if (k === "ratio" || k === "formato") {
    if (v === "1:1" || v === "4:5" || v === "9:16") brief.ratio = v;
  } else if (k === "points" || k === "puntos") {
    brief.points = v.split(/[|\n]/).map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  } else if (k === "hashtags" || k === "tags") {
    brief.hashtags = parseHashtags(v);
  }
}

function parseHashtags(text) {
  return String(text)
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

function parseFrontmatter(block, brief) {
  let listKey = null;
  for (const raw of block.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      listKey = null;
      continue;
    }
    const list = line.match(/^\s*-\s+(.*)$/);
    if (list && listKey) {
      if (listKey === "points") brief.points.push(list[1].trim());
      else if (listKey === "hashtags") brief.hashtags.push(...parseHashtags(list[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (key === "points" || key === "puntos") {
      listKey = "points";
      brief.points = brief.points || [];
      if (val) applyKey(brief, "points", val);
      continue;
    }
    if (key === "hashtags" || key === "tags") {
      listKey = "hashtags";
      brief.hashtags = brief.hashtags || [];
      if (val) applyKey(brief, "hashtags", val);
      continue;
    }
    listKey = null;
    applyKey(brief, key, val);
  }
}

function splitSections(body) {
  const lines = body.split(/\r?\n/);
  const sections = [{ title: "", lines: [] }];
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      sections.push({ title: h2[1].trim().toLowerCase(), lines: [] });
      continue;
    }
    sections[sections.length - 1].lines.push(line);
  }
  return sections;
}

function parseSlideBlock(lines) {
  const slide = {};
  const items = [];
  for (const line of lines) {
    const kv = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([A-Za-z]+)(?:\*\*)?\s*[:=]\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (key === "items") items.push(...val.split("|").map((s) => s.trim()).filter(Boolean));
    else if (key === "notes") slide.notes = val;
    else if (
      ["title", "body", "kicker", "footer", "quote", "author", "stat", "label"].includes(key)
    ) {
      slide[key] = val;
    }
  }
  if (items.length) slide.items = items;
  return slide;
}

function parseSlides(text) {
  const slides = [];
  const chunks = text.split(/^###\s+/m).slice(1);
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    const heading = (nl === -1 ? chunk : chunk.slice(0, nl)).trim().toLowerCase();
    const layout = heading.split(/\s+/)[0];
    if (!LAYOUTS.has(layout)) continue;
    const body = nl === -1 ? "" : chunk.slice(nl + 1);
    slides.push({ layout, notes: layout, ...parseSlideBlock(body.split(/\r?\n/)) });
  }
  return slides;
}

function bullets(lines) {
  return lines
    .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
    .filter((l) => l && !l.startsWith("#"));
}

export function parseBriefMarkdown(source) {
  const brief = { points: [], hashtags: [] };
  let body = String(source ?? "").replace(/^\uFEFF/, "").trim();

  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end !== -1) {
      parseFrontmatter(body.slice(3, end), brief);
      body = body.slice(end + 4).trim();
    }
  }

  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1 && !brief.name) brief.name = h1[1].trim();

  const topKv = body.match(/^(?:[A-Za-zÁÉÍÓÚáéíóú][\wÁÉÍÓÚáéíóú]*:\s*.+\n)+/m);
  if (topKv) {
    for (const line of topKv[0].split("\n")) {
      const kv = line.match(/^([^:]+):\s*(.+)$/);
      if (kv) applyKey(brief, kv[1], kv[2]);
    }
  }

  for (const section of splitSections(body)) {
    const t = section.title;
    const text = section.lines.join("\n").trim();
    if (!t || !text) continue;
    if (t === "topic" || t === "tema") brief.topic = text.split("\n")[0].trim();
    else if (t === "points" || t === "puntos") brief.points = bullets(section.lines);
    else if (t === "caption" || t === "texto" || t === "copy") brief.caption = text;
    else if (t === "hashtags" || t === "tags") brief.hashtags = parseHashtags(text);
    else if (t === "cta") brief.cta = text.split("\n")[0].trim();
    else if (t === "slides" || t === "diapositivas") {
      const slides = parseSlides(text.startsWith("###") ? text : `### ${text}`);
      if (slides.length) brief.slides = slides;
    }
  }

  if (!brief.topic && brief.name) brief.topic = brief.name;
  if (!brief.points?.length) delete brief.points;
  if (!brief.hashtags?.length) delete brief.hashtags;
  if (!brief.slides?.length) delete brief.slides;
  return brief;
}
