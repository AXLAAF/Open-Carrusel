#!/usr/bin/env node
/**
 * OpenCarrusel CLI (oc)
 *
 * Agent-friendly: Cursor, Claude Code, Gemini CLI, or any subprocess.
 * Prefers the running app at OC_API (default http://localhost:3000).
 * Falls back to data/carousels.json + data/slides/ if the server is down.
 *
 *   npm run oc -- list
 *   npm run oc -- slide add <carouselId> --blank
 *   npm run oc -- slide update <carouselId> <slideId> --html-file ./hook.html
 */

import { readFile, writeFile, mkdir, rename, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import {
  bindCli,
  dispatchStudio,
  cmdBrandExtra,
  addSlideFromLayout,
  exportWithOptions,
} from "./lib/oc-studio.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const CAROUSELS_FILE = path.join(DATA, "carousels.json");
const BASE = (process.env.OC_API || "http://localhost:3000").replace(/\/$/, "");
const RATIOS = new Set(["1:1", "4:5", "9:16"]);
const MAX_SLIDES = 20;

const args = process.argv.slice(2);
const jsonOut = takeFlag("json");
const apiOnly = takeFlag("api");
const fileOnly = takeFlag("file");

function takeFlag(name) {
  const i = args.findIndex((a) => a === `--${name}`);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
}

function takeOpt(name) {
  const i = args.findIndex((a) => a === `--${name}`);
  if (i === -1) return undefined;
  const val = args[i + 1];
  if (!val || val.startsWith("--")) {
    args.splice(i, 1);
    return "";
  }
  args.splice(i, 2);
  return val;
}

function die(message, code = 1) {
  if (jsonOut) {
    console.log(JSON.stringify({ ok: false, error: message }));
  } else {
    console.error(`oc: ${message}`);
  }
  process.exit(code);
}

function print(data, human) {
  if (jsonOut) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(human ?? JSON.stringify(data, null, 2));
  }
}

function slideFile(carouselId, slideId) {
  return path.join(DATA, "slides", carouselId, `${slideId}.html`);
}

async function readHtmlInput() {
  const file = takeOpt("html-file");
  const inline = takeOpt("html");
  if (file === "-") {
    return readStdin();
  }
  if (file) {
    const abs = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    return readFile(abs, "utf-8");
  }
  if (inline != null) return inline;
  return null;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);
  });
}

async function api(method, pathname, body, raw = false) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: body && !raw ? { "Content-Type": "application/json" } : undefined,
    body: body == null ? undefined : raw ? body : JSON.stringify(body),
  });
  if (raw) {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
    }
    return res;
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

async function serverUp() {
  try {
    const res = await fetch(`${BASE}/api/carousels`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadStore() {
  try {
    const raw = await readFile(CAROUSELS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { carousels: [] };
  }
}

async function saveStore(store) {
  await mkdir(DATA, { recursive: true });
  const tmp = CAROUSELS_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await rename(tmp, CAROUSELS_FILE);
}

async function writeSlide(carouselId, slideId, html) {
  const file = slideFile(carouselId, slideId);
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  await writeFile(tmp, html, "utf-8");
  await rename(tmp, file);
}

async function materialize(carousel) {
  await Promise.all(
    (carousel.slides || []).map((s) =>
      s.html ? writeSlide(carousel.id, s.id, s.html) : Promise.resolve()
    )
  );
}

async function hydrate(carousel) {
  if (!carousel) return null;
  const slides = await Promise.all(
    carousel.slides.map(async (s) => {
      try {
        const html = await readFile(slideFile(carousel.id, s.id), "utf-8");
        return { ...s, html };
      } catch {
        if (s.html) await writeSlide(carousel.id, s.id, s.html);
        return s;
      }
    })
  );
  return { ...carousel, slides };
}

function now() {
  return new Date().toISOString();
}

function blankHtml(ratio = "4:5") {
  const dims = { "1:1": [1080, 1080], "4:5": [1080, 1350], "9:16": [1080, 1920] };
  const [w, h] = dims[ratio] || dims["4:5"];
  return `<div class="xook-slide" style="width:${w}px;height:${h}px">
  <div class="xook-tag">NUEVO</div>
  <h1 class="xook-title">Titular</h1>
  <p class="xook-body">Edita data/slides/&lt;carouselId&gt;/&lt;slideId&gt;.html o usa oc slide update.</p>
  <div class="xook-logo">Open Carrusel</div>
</div>`;
}

async function shouldUseApi() {
  if (fileOnly) return false;
  if (apiOnly) return true;
  return serverUp();
}

const HELP = `OpenCarrusel CLI — el editor entiende esto. La IA es opcional.

Cómo hacer un carrusel (sin IA)
  1. pnpm oc -- brand set --name "XookTech" --accent "#e94560" --heading Borscha --body Rostex
  2. pnpm oc -- make --name "5 errores" --topic "Tu hook de 8 palabras" --points "Uno|Dos|Tres" --cta "Guarda esto"
     o: pnpm oc -- compose examples/carousel-brief.md
     o: pnpm oc -- compose examples/carousel-brief.json
  3. Abre la URL del editor. Corrige texto (clic en el preview), tipo, capas y exporta a mano
  4. pnpm oc -- export <id> --format png

Usage:
  pnpm oc -- <command> [args] [--json]
  npm run oc -- <command>   (equivale)

Compose
  make | compose [--name] [--topic] [--points a|b|c] [--cta] [--ratio] [--caption] [--hashtags]
                 [--primary] [--accent] [--background] [--text]
  compose <brief.md|brief.json>
  playbook [docs/publicacion.md]
  layouts

Carousels
  list
  create <name> [--ratio 1:1|4:5|9:16]
  get <id>
  delete <id>
  duplicate <id>
  rename <id> <name>
  ratio <id> <1:1|4:5|9:16>   # also resizes slide HTML
  open <id>
  path <id> [slideId]

Palette (per carousel — does not rewrite brand.json)
  palette <id>                         # show
  palette <id> --background "#111" --text "#fff" --accent "#e94560"
  palette clear <id>

Hook A/B (3 opciones persistentes — cambia cuando quieras)
  hook variants <id> [--title "..."]
  hook pick <id> <1|2|3>

Schedule / queue
  schedule list
  schedule <id> --at "2026-08-20T18:00"
  schedule clear <id>
  schedule status <id> draft|ready|scheduled|published

Brand layout library (XookTech)
  library list
  library apply <layoutId> <carouselId> [--slide id | --add]
  library reseed

Review
  review <id>

Import (URL / Notion / PDF → brief.md → compose)
  import <url> [--compose] [--out brief.md] [--name] [--ratio]
  import <file.pdf> [--compose]
  import --text "..." [--compose]

Slides
  slides <id>
  slide add <id> --layout hook|setup|value|list|quote|stat|summary|cta
                 [--title] [--body] [--kicker] [--footer] [--items a|b|c]
                 [--quote] [--author] [--stat] [--label] [--notes]
  slide add <id> [--blank] [--html-file f] [--html '...'] [--notes '...']
  slide field <id> <slideId> --title "..." [--body] [--kicker] [--footer]
  slide get|update|delete|duplicate|undo <id> <slideId>
  slide restyle <id> <slideId> [--layout hook]
  reorder <id> <id1,id2,...>

Workspace
  dump <id> [dir]
  apply <id> [dir]

Brand / templates / media
  brand
  brand set --name --primary --secondary --accent --background --surface --text --heading --body --logo --keywords
  brand apply <carouselId>
  templates list|save <carouselId>|use <templateId>
  presets list|apply <presetId> [--carousel id]
  upload <image.png>
  caption <id> [--text '...'] [--hashtags tag1,tag2]

Export
  export <id> [--slide id] [--format png|jpg] [--quality 90] [--naming index|id|name] [--out file]

Other
  doctor

Flags
  --json        Machine-readable output
  --api         Require localhost API (no file fallback)
  --file        Skip API, write data/ directly
  --html-file - Read HTML from stdin

Env
  OC_API        API origin (default http://localhost:3000)

Manual edits
  data/slides/<carouselId>/<slideId>.html
  Preview: http://localhost:3000/carousel/<id> (polls; no restart)
  Clic en el texto del preview; rail derecho = Diseño · Capas · Marca · Medios · Historial · Publicar · HTML
`;

async function main() {
  const cmd = args.shift();
  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
    console.log(HELP);
    return;
  }

  const http = await shouldUseApi();
  bindCli({
    args,
    ROOT,
    DATA,
    BASE,
    MAX_SLIDES,
    die,
    print,
    takeOpt,
    takeFlag,
    api,
    loadStore,
    saveStore,
    writeSlide,
    slideFile,
    now,
    randomUUID,
  });

  switch (cmd) {
    case "list":
      return cmdList(http);
    case "create":
      return cmdCreate(http);
    case "get":
      return cmdGet(http);
    case "delete":
      return cmdDelete(http);
    case "rename":
      return cmdRename(http);
    case "ratio":
      return cmdRatio(http);
    case "open":
      return cmdOpen();
    case "path":
      return cmdPath();
    case "slides":
      return cmdSlides(http);
    case "slide":
      return cmdSlide(http);
    case "reorder":
      return cmdReorder(http);
    case "dump":
      return cmdDump(http);
    case "apply":
      return cmdApply(http);
    case "caption":
      return cmdCaption(http);
    case "brand": {
      const extra = await cmdBrandExtra(http);
      if (extra !== false) return extra;
      return cmdBrand(http);
    }
    case "export":
      return cmdExport(http);
    case "compose":
    case "make":
    case "templates":
    case "presets":
    case "upload":
    case "duplicate":
    case "doctor":
    case "layouts":
    case "playbook":
    case "palette":
    case "hook":
    case "schedule":
    case "library":
    case "review":
    case "import":
      return dispatchStudio(cmd, http);
    default:
      die(`unknown command "${cmd}". Run: npm run oc -- help`);
  }
}

async function cmdList(http) {
  const carousels = http
    ? (await api("GET", "/api/carousels")).carousels
    : (await loadStore()).carousels.filter((c) => !c.isTemplate);

  print(
    carousels.map((c) => ({
      id: c.id,
      name: c.name,
      aspectRatio: c.aspectRatio,
      slides: c.slides?.length ?? 0,
      updatedAt: c.updatedAt,
    })),
    carousels.length === 0
      ? "(no carousels)"
      : carousels
          .map(
            (c) =>
              `${c.id}  ${(c.slides?.length ?? 0).toString().padStart(2)} slides  ${c.aspectRatio}  ${c.name}`
          )
          .join("\n")
  );
}

async function cmdCreate(http) {
  const name = args.shift();
  if (!name) die("create requires a name");
  const ratio = takeOpt("ratio") || "4:5";
  if (!RATIOS.has(ratio)) die(`invalid ratio "${ratio}"`);

  if (http) {
    const created = await api("POST", "/api/carousels", {
      name,
      aspectRatio: ratio,
    });
    print(
      created,
      `Created ${created.id}\nEditor: ${BASE}/carousel/${created.id}`
    );
    return;
  }

  const store = await loadStore();
  const carousel = {
    id: randomUUID(),
    name,
    aspectRatio: ratio,
    slides: [],
    referenceImages: [],
    chatSessionId: null,
    isTemplate: false,
    tags: [],
    createdAt: now(),
    updatedAt: now(),
  };
  store.carousels.push(carousel);
  await saveStore(store);
  print(carousel, `Created ${carousel.id}\nEditor: ${BASE}/carousel/${carousel.id}`);
}

async function getCarousel(http, id) {
  if (http) return api("GET", `/api/carousels/${id}`);
  const store = await loadStore();
  const found = store.carousels.find((c) => c.id === id);
  if (!found) throw new Error("Carousel not found");
  return hydrate(found);
}

async function cmdGet(http) {
  const id = args.shift();
  if (!id) die("get requires a carousel id");
  const c = await getCarousel(http, id);
  await materialize(c);
  print(
    c,
    `${c.name}  ${c.id}\n${c.aspectRatio}  ${c.slides.length} slides\n${BASE}/carousel/${c.id}\n` +
      c.slides
        .map(
          (s, i) =>
            `  ${String(i + 1).padStart(2)}. ${s.id}  ${slideFile(c.id, s.id)}`
        )
        .join("\n")
  );
}

async function cmdDelete(http) {
  const id = args.shift();
  if (!id) die("delete requires a carousel id");
  if (http) {
    await api("DELETE", `/api/carousels/${id}`);
  } else {
    const store = await loadStore();
    const idx = store.carousels.findIndex((c) => c.id === id);
    if (idx === -1) die("Carousel not found");
    store.carousels.splice(idx, 1);
    await saveStore(store);
    await rm(path.join(DATA, "slides", id), { recursive: true, force: true });
  }
  print({ ok: true, id }, `Deleted ${id}`);
}

async function cmdRename(http) {
  const id = args.shift();
  const name = args.shift();
  if (!id || !name) die("rename <id> <name>");
  if (http) {
    const updated = await api("PUT", `/api/carousels/${id}`, { name });
    print(updated, `Renamed to "${updated.name}"`);
    return;
  }
  const store = await loadStore();
  const c = store.carousels.find((x) => x.id === id);
  if (!c) die("Carousel not found");
  c.name = name;
  c.updatedAt = now();
  await saveStore(store);
  print(c, `Renamed to "${name}"`);
}

async function cmdRatio(http) {
  const id = args.shift();
  const ratio = args.shift();
  if (!id || !ratio) die("ratio <id> <1:1|4:5|9:16>");
  if (!RATIOS.has(ratio)) die(`invalid ratio "${ratio}"`);
  if (http) {
    const updated = await api("PUT", `/api/carousels/${id}`, {
      aspectRatio: ratio,
    });
    print(
      updated,
      `Aspect ratio → ${ratio} (slides redimensionados a ${ratio === "1:1" ? "1080×1080" : ratio === "4:5" ? "1080×1350" : "1080×1920"})`
    );
    return;
  }
  const { resizeSlideHtml } = await import("./lib/layouts.mjs");
  const store = await loadStore();
  const c = store.carousels.find((x) => x.id === id);
  if (!c) die("Carousel not found");
  c.aspectRatio = ratio;
  c.updatedAt = now();
  for (const slide of c.slides) {
    const file = slideFile(id, slide.id);
    try {
      const html = await readFile(file, "utf-8");
      const next = resizeSlideHtml(html, ratio);
      await writeFile(file, next, "utf-8");
      slide.html = next;
    } catch {
      // slide file missing — skip
    }
  }
  await saveStore(store);
  print(c, `Aspect ratio → ${ratio}`);
}

function cmdOpen() {
  const id = args.shift();
  if (!id) die("open requires a carousel id");
  const url = `${BASE}/carousel/${id}`;
  print({ url }, url);
}

function cmdPath() {
  const id = args.shift();
  const slideId = args.shift();
  if (!id) die("path <carouselId> [slideId]");
  if (slideId) {
    const p = slideFile(id, slideId);
    print({ path: p }, p);
    return;
  }
  const dir = path.join(DATA, "slides", id);
  print({ path: dir }, dir);
}

async function cmdSlides(http) {
  const id = args.shift();
  if (!id) die("slides requires a carousel id");
  const c = await getCarousel(http, id);
  await materialize(c);
  print(
    c.slides.map((s, i) => ({
      index: i + 1,
      id: s.id,
      notes: s.notes,
      file: slideFile(c.id, s.id),
    })),
    c.slides.length === 0
      ? "(no slides)"
      : c.slides
          .map(
            (s, i) =>
              `${String(i + 1).padStart(2)}. ${s.id}${s.notes ? `  — ${s.notes}` : ""}\n     ${slideFile(c.id, s.id)}`
          )
          .join("\n")
  );
}

async function cmdSlide(http) {
  const sub = args.shift();
  const id = args.shift();
  if (!sub || !id) die("slide <add|get|update|delete|duplicate|undo> <carouselId> ...");

  switch (sub) {
    case "add":
      return slideAdd(http, id);
    case "get":
      return slideGet(http, id);
    case "update":
      return slideUpdate(http, id);
    case "delete":
      return slideDelete(http, id);
    case "duplicate":
      return slideDuplicate(http, id);
    case "undo":
      return slideUndo(http, id);
    case "field":
      return slideField(http, id);
    case "restyle":
      return slideRestyle(http, id);
    default:
      die(`unknown slide command "${sub}". Use add|get|update|field|delete|duplicate|undo|restyle`);
  }
}

async function slideRestyle(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide restyle <carouselId> <slideId> [--layout hook]");
  const layout = takeOpt("layout");
  if (!http) die("restyle requires the running app (npm run dev)");
  const slide = await api(
    "POST",
    `/api/carousels/${id}/slides/${slideId}/restyle`,
    layout ? { layout } : {}
  );
  print(slide, `Restyled ${slideId}`);
}

async function slideAdd(http, id) {
  const laid = await addSlideFromLayout(http, id);
  if (laid) return;
  const notes = takeOpt("notes") || "";
  const blank = takeFlag("blank");
  let html = await readHtmlInput();
  if (!html && !blank) {
    html = null;
  }

  if (http) {
    const body = html
      ? { html, notes }
      : { blank: true, notes };
    const slide = await api("POST", `/api/carousels/${id}/slides`, body);
    const file = slideFile(id, slide.id);
    print(
      { ...slide, file },
      `Added slide ${slide.id}\nFile: ${file}\nEdit that file; the preview refreshes on its own.`
    );
    return;
  }

  const store = await loadStore();
  const c = store.carousels.find((x) => x.id === id);
  if (!c) die("Carousel not found");
  if (c.slides.length >= MAX_SLIDES) die("Max slides reached");
  const slide = {
    id: randomUUID(),
    html: html || blankHtml(c.aspectRatio),
    previousVersions: [],
    order: c.slides.length,
    notes,
  };
  c.slides.push(slide);
  c.updatedAt = now();
  await saveStore(store);
  await writeSlide(id, slide.id, slide.html);
  const file = slideFile(id, slide.id);
  print({ ...slide, file }, `Added slide ${slide.id}\nFile: ${file}`);
}

async function slideGet(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide get <carouselId> <slideId>");
  const c = await getCarousel(http, id);
  await materialize(c);
  const slide = c.slides.find((s) => s.id === slideId);
  if (!slide) die("Slide not found");
  if (jsonOut) {
    print({ ...slide, file: slideFile(id, slideId) });
  } else {
    process.stdout.write(slide.html);
    if (!slide.html.endsWith("\n")) process.stdout.write("\n");
  }
}

async function slideField(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide field <carouselId> <slideId> --title|--body|--kicker|--footer ...");
  const patch = {
    kicker: takeOpt("kicker"),
    title: takeOpt("title"),
    body: takeOpt("body"),
    footer: takeOpt("footer"),
    quote: takeOpt("quote"),
    author: takeOpt("author"),
    stat: takeOpt("stat"),
    label: takeOpt("label"),
  };
  const entries = Object.entries(patch).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) {
    die("provide at least one of --title --body --kicker --footer --quote --author --stat --label");
  }

  const c = await getCarousel(http, id);
  await materialize(c);
  const slide = c.slides.find((s) => s.id === slideId);
  if (!slide) die("Slide not found");

  let html = slide.html;
  for (const [name, text] of entries) {
    html = patchOcField(html, name, text);
  }

  if (http) {
    const updated = await api("PUT", `/api/carousels/${id}/slides/${slideId}`, { html });
    print(updated, `Updated fields on ${slideId}`);
    return;
  }

  const store = await loadStore();
  const found = store.carousels.find((x) => x.id === id);
  const target = found?.slides.find((s) => s.id === slideId);
  if (!found || !target) die("Slide not found");
  if (html !== target.html) {
    target.previousVersions.push(target.html);
    if (target.previousVersions.length > 5) target.previousVersions.shift();
    target.html = html;
  }
  found.updatedAt = now();
  await saveStore(store);
  await writeSlide(id, slideId, html);
  print(target, `Updated fields on ${slideId}`);
}

function patchOcField(html, name, text) {
  const needle = `data-oc-field="${name}"`;
  const idx = html.indexOf(needle);
  if (idx === -1) return html;
  const gt = html.indexOf(">", idx);
  const tagStart = html.lastIndexOf("<", idx);
  const tagMatch = html.slice(tagStart + 1).match(/^([a-zA-Z0-9-]+)/);
  if (!tagMatch || gt === -1) return html;
  const close = `</${tagMatch[1]}>`;
  const closeAt = html.indexOf(close, gt);
  if (closeAt === -1) return html;
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return html.slice(0, gt + 1) + escaped + html.slice(closeAt);
}

async function slideUpdate(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide update <carouselId> <slideId> [--html-file f]");
  const notes = takeOpt("notes");
  const html = await readHtmlInput();
  if (html == null && notes == null) die("provide --html-file, --html, or --notes");

  const updates = {};
  if (html != null) updates.html = html;
  if (notes != null) updates.notes = notes;

  if (http) {
    const slide = await api(
      "PUT",
      `/api/carousels/${id}/slides/${slideId}`,
      updates
    );
    print(slide, `Updated ${slideId}`);
    return;
  }

  const store = await loadStore();
  const c = store.carousels.find((x) => x.id === id);
  if (!c) die("Carousel not found");
  const slide = c.slides.find((s) => s.id === slideId);
  if (!slide) die("Slide not found");
  if (updates.html && updates.html !== slide.html) {
    slide.previousVersions.push(slide.html);
    if (slide.previousVersions.length > 5) slide.previousVersions.shift();
    slide.html = updates.html;
    await writeSlide(id, slideId, updates.html);
  }
  if (updates.notes != null) slide.notes = updates.notes;
  c.updatedAt = now();
  await saveStore(store);
  print(slide, `Updated ${slideId}`);
}

async function slideDelete(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide delete <carouselId> <slideId>");
  if (http) {
    await api("DELETE", `/api/carousels/${id}/slides/${slideId}`);
  } else {
    const store = await loadStore();
    const c = store.carousels.find((x) => x.id === id);
    if (!c) die("Carousel not found");
    const idx = c.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) die("Slide not found");
    c.slides.splice(idx, 1);
    c.slides.forEach((s, i) => {
      s.order = i;
    });
    c.updatedAt = now();
    await saveStore(store);
    await rm(slideFile(id, slideId), { force: true });
  }
  print({ ok: true, id: slideId }, `Deleted slide ${slideId}`);
}

async function slideDuplicate(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide duplicate <carouselId> <slideId>");
  if (http) {
    const slide = await api(
      "POST",
      `/api/carousels/${id}/slides/${slideId}/duplicate`
    );
    print(
      { ...slide, file: slideFile(id, slide.id) },
      `Duplicated → ${slide.id}\nFile: ${slideFile(id, slide.id)}`
    );
    return;
  }
  const store = await loadStore();
  const c = store.carousels.find((x) => x.id === id);
  if (!c) die("Carousel not found");
  const source = c.slides.find((s) => s.id === slideId);
  if (!source) die("Slide not found");
  if (c.slides.length >= MAX_SLIDES) die("Max slides reached");
  const hydrated = await hydrate(c);
  const html = hydrated.slides.find((s) => s.id === slideId)?.html || source.html;
  const slide = {
    id: randomUUID(),
    html,
    previousVersions: [],
    order: c.slides.length,
    notes: source.notes,
  };
  c.slides.push(slide);
  c.updatedAt = now();
  await saveStore(store);
  await writeSlide(id, slide.id, html);
  print({ ...slide, file: slideFile(id, slide.id) }, `Duplicated → ${slide.id}`);
}

async function slideUndo(http, id) {
  const slideId = args.shift();
  if (!slideId) die("slide undo <carouselId> <slideId>");
  if (http) {
    const slide = await api(
      "POST",
      `/api/carousels/${id}/slides/${slideId}/undo`
    );
    print(slide, `Undid last change on ${slideId}`);
    return;
  }
  die("undo requires the API (start the app with npm run dev)");
}

async function cmdReorder(http) {
  const id = args.shift();
  const list = args.shift();
  if (!id || !list) die("reorder <carouselId> <id1,id2,...>");
  const slideIds = list.split(",").map((s) => s.trim()).filter(Boolean);
  if (http) {
    await api("PUT", `/api/carousels/${id}/slides`, { slideIds });
    print({ ok: true, slideIds }, `Reordered ${slideIds.length} slides`);
    return;
  }
  die("reorder requires the API (start the app with npm run dev)");
}

async function cmdDump(http) {
  const id = args.shift();
  if (!id) die("dump <carouselId> [dir]");
  const dirArg = args.shift();
  const dir = dirArg
    ? path.resolve(process.cwd(), dirArg)
    : path.join(DATA, "workspace", id);
  const c = await getCarousel(http, id);
  await materialize(c);
  await mkdir(dir, { recursive: true });
  const meta = {
    id: c.id,
    name: c.name,
    aspectRatio: c.aspectRatio,
    caption: c.caption || "",
    hashtags: c.hashtags || [],
    slides: c.slides.map((s) => ({ id: s.id, notes: s.notes })),
  };
  await writeFile(path.join(dir, "_meta.json"), JSON.stringify(meta, null, 2));
  const files = [];
  for (let i = 0; i < c.slides.length; i++) {
    const s = c.slides[i];
    const name = `${String(i + 1).padStart(2, "0")}-${s.id}.html`;
    await writeFile(path.join(dir, name), s.html, "utf-8");
    files.push(name);
  }
  print(
    { dir, files },
    `Dumped ${files.length} slides → ${dir}\nEdit the HTML files, then: npm run oc -- apply ${id}`
  );
}

async function cmdApply(http) {
  const id = args.shift();
  if (!id) die("apply <carouselId> [dir]");
  const dirArg = args.shift();
  const dir = dirArg
    ? path.resolve(process.cwd(), dirArg)
    : path.join(DATA, "workspace", id);
  if (!existsSync(dir)) die(`directory not found: ${dir}`);

  const names = (await readdir(dir))
    .filter((f) => f.endsWith(".html"))
    .sort();

  for (const name of names) {
    const html = await readFile(path.join(dir, name), "utf-8");
    const match = name.match(/^[0-9]+-([0-9a-fA-F-]+)\.html$/);
    const slideId = match?.[1];
    if (slideId && http) {
      try {
        await api("PUT", `/api/carousels/${id}/slides/${slideId}`, { html });
        continue;
      } catch {
        // fall through to add
      }
    }
    if (http) {
      await api("POST", `/api/carousels/${id}/slides`, { html, notes: name });
    } else if (slideId) {
      await writeSlide(id, slideId, html);
    }
  }

  print({ ok: true, applied: names.length, dir }, `Applied ${names.length} files from ${dir}`);
}

async function cmdCaption(http) {
  const id = args.shift();
  if (!id) die("caption <id> [--text '...'] [--hashtags a,b]");
  const text = takeOpt("text");
  const tags = takeOpt("hashtags");
  const body = {};
  if (text != null) body.caption = text;
  if (tags != null) {
    body.hashtags = tags
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);
  }
  if (Object.keys(body).length === 0) die("provide --text and/or --hashtags");
  if (!http) die("caption requires the API (start the app with npm run dev)");
  const updated = await api("PUT", `/api/carousels/${id}/caption`, body);
  print(updated, "Caption saved");
}

async function cmdBrand(http) {
  if (!http) {
    try {
      const brand = JSON.parse(await readFile(path.join(DATA, "brand.json"), "utf-8"));
      print(brand);
    } catch {
      die("brand.json not found");
    }
    return;
  }
  print(await api("GET", "/api/brand"));
}

async function cmdExport(http) {
  const id = args.shift();
  if (!id) die("export <carouselId> [--out file] [--slide id] [--format png|jpg]");
  if (!http) die("export requires the running app (npm run dev)");
  if (
    args.includes("--slide") ||
    args.includes("--format") ||
    args.includes("--quality") ||
    args.includes("--naming") ||
    args.includes("--out")
  ) {
    return exportWithOptions(http, id);
  }
  const outfile = args.shift() || path.join(process.cwd(), `carousel-${id}.zip`);
  const res = await api("POST", `/api/carousels/${id}/export`, undefined, true);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outfile, buf);
  print({ file: outfile, bytes: buf.length }, `Exported ${outfile} (${buf.length} bytes)`);
}

main().catch((err) => {
  die(err.message || String(err));
});
