/**
 * Extra oc commands: compose, brand set/apply, templates, presets, upload, duplicate, doctor.
 * Bound from scripts/oc.mjs so helpers (args, api, print) stay in one place.
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { LAYOUT_IDS, renderLayout, slidesFromBrief, isLayoutId } from "./layouts.mjs";
import { parseBriefMarkdown } from "./brief-md.mjs";
import { formatReviewReport, reviewCarousel } from "./slide-review.mjs";

let cli = null;

export function bindCli(helpers) {
  cli = helpers;
}

export async function dispatchStudio(cmd, http) {
  switch (cmd) {
    case "compose":
    case "make":
      return cmdCompose(http);
    case "templates":
      return cmdTemplates(http);
    case "presets":
      return cmdPresets(http);
    case "upload":
      return cmdUpload(http);
    case "duplicate":
      return cmdDuplicate(http);
    case "doctor":
      return cmdDoctor();
    case "layouts":
      return cmdLayouts();
    case "playbook":
      return cmdPlaybook();
    case "palette":
      return cmdPalette(http);
    case "hook":
      return cmdHook(http);
    case "schedule":
      return cmdSchedule(http);
    case "library":
      return cmdLibrary(http);
    case "review":
      return cmdReview(http);
    case "import":
      return cmdImport(http);
    default:
      return false;
  }
}

export async function cmdBrandExtra(http) {
  const sub = cli.args[0];
  if (sub === "set") {
    cli.args.shift();
    return cmdBrandSet(http);
  }
  if (sub === "apply") {
    cli.args.shift();
    return cmdBrandApply(http);
  }
  return false;
}

async function loadBrand(http) {
  if (http) return cli.api("GET", "/api/brand");
  try {
    return JSON.parse(await readFile(path.join(cli.DATA, "brand.json"), "utf-8"));
  } catch {
    return { name: "", colors: {}, fonts: {} };
  }
}

function takeFields() {
  const itemsRaw = cli.takeOpt("items");
  const fields = {
    kicker: cli.takeOpt("kicker"),
    title: cli.takeOpt("title"),
    body: cli.takeOpt("body"),
    footer: cli.takeOpt("footer"),
    quote: cli.takeOpt("quote"),
    author: cli.takeOpt("author"),
    stat: cli.takeOpt("stat"),
    label: cli.takeOpt("label"),
    items: itemsRaw
      ? itemsRaw.split("|").map((s) => s.trim()).filter(Boolean)
      : undefined,
  };
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v != null && v !== "")
  );
}

export async function addSlideFromLayout(http, carouselId) {
  const layout = cli.takeOpt("layout");
  if (!layout) return null;
  if (!isLayoutId(layout)) cli.die(`unknown layout "${layout}". See: npm run oc -- layouts`);
  const notes = cli.takeOpt("notes") || layout;
  const fields = takeFields();
  const brand = await loadBrand(http);

  if (http) {
    const slide = await cli.api("POST", `/api/carousels/${carouselId}/slides`, {
      layout,
      fields,
      notes,
    });
    const file = cli.slideFile(carouselId, slide.id);
    cli.print(
      { ...slide, file, layout },
      `Added ${layout} slide ${slide.id}\nFile: ${file}`
    );
    return slide;
  }

  const store = await cli.loadStore();
  const c = store.carousels.find((x) => x.id === carouselId);
  if (!c) cli.die("Carousel not found");
  if (c.slides.length >= cli.MAX_SLIDES) cli.die("Max slides reached");
  const html = renderLayout(layout, fields, brand, c.aspectRatio);
  const slide = {
    id: cli.randomUUID(),
    html,
    previousVersions: [],
    order: c.slides.length,
    notes,
  };
  c.slides.push(slide);
  c.updatedAt = cli.now();
  await cli.saveStore(store);
  await cli.writeSlide(carouselId, slide.id, html);
  const file = cli.slideFile(carouselId, slide.id);
  cli.print({ ...slide, file, layout }, `Added ${layout} slide ${slide.id}\nFile: ${file}`);
  return slide;
}

async function cmdCompose(http) {
  let brief = {};
  const peek = cli.args[0];
  if (peek && !peek.startsWith("--")) {
    const lower = peek.toLowerCase();
    if (
      lower.endsWith(".json") ||
      lower.endsWith(".md") ||
      lower.endsWith(".markdown")
    ) {
      const fileArg = cli.args.shift();
      const abs = path.isAbsolute(fileArg)
        ? fileArg
        : path.resolve(process.cwd(), fileArg);
      if (!existsSync(abs)) cli.die(`brief not found: ${abs}`);
      const raw = await readFile(abs, "utf-8");
      brief = lower.endsWith(".json")
        ? JSON.parse(raw)
        : parseBriefMarkdown(raw);
    }
  }

  const name = cli.takeOpt("name") || brief.name;
  const topic = cli.takeOpt("topic") || brief.topic;
  const pointsRaw = cli.takeOpt("points");
  const cta = cli.takeOpt("cta") || brief.cta;
  const ratio = cli.takeOpt("ratio") || brief.ratio || "4:5";
  const caption = cli.takeOpt("caption") || brief.caption;
  const tags = cli.takeOpt("hashtags");
  if (pointsRaw) brief.points = pointsRaw.split("|").map((s) => s.trim()).filter(Boolean);
  if (name) brief.name = name;
  if (topic) brief.topic = topic;
  if (cta) brief.cta = cta;
  brief.ratio = ratio;
  if (caption) brief.caption = caption;
  if (tags) {
    brief.hashtags = tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean);
  }
  const colorPatch = {};
  for (const key of ["primary", "secondary", "accent", "background", "surface", "text"]) {
    const val = cli.takeOpt(key);
    if (val != null) colorPatch[key] = val;
  }
  if (Object.keys(colorPatch).length) {
    brief.colors = { ...(brief.colors || {}), ...colorPatch };
  }
  if (!brief.name) {
    cli.die('compose requires a name (brief.md / brief.json or --name "...")');
  }

  if (http) {
    const created = await cli.api("POST", "/api/carousels/compose", brief);
    cli.print(
      created,
      `Composed ${created.id}  ${created.slides?.length ?? 0} slides\nEditor: ${cli.BASE}/carousel/${created.id}\n` +
        `CLI: npm run oc -- get ${created.id}`
    );
    return;
  }

  const baseBrand = await loadBrand(false);
  const brand = brief.colors
    ? { ...baseBrand, colors: { ...(baseBrand.colors || {}), ...brief.colors } }
    : baseBrand;
  const store = await cli.loadStore();
  const carousel = {
    id: cli.randomUUID(),
    name: brief.name,
    aspectRatio: ratio,
    slides: [],
    referenceImages: [],
    chatSessionId: null,
    isTemplate: false,
    tags: [],
    caption: brief.caption || "",
    hashtags: brief.hashtags || [],
    createdAt: cli.now(),
    updatedAt: cli.now(),
  };
  for (const spec of slidesFromBrief(brief)) {
    const html = renderLayout(spec.layout, spec, brand, ratio);
    const slide = {
      id: cli.randomUUID(),
      html,
      previousVersions: [],
      order: carousel.slides.length,
      notes: spec.notes || spec.layout,
    };
    carousel.slides.push(slide);
    await cli.writeSlide(carousel.id, slide.id, html);
  }
  store.carousels.push(carousel);
  await cli.saveStore(store);
  cli.print(
    carousel,
    `Composed ${carousel.id}  ${carousel.slides.length} slides\nEditor: ${cli.BASE}/carousel/${carousel.id}`
  );
}

async function cmdBrandSet(http) {
  const patch = {};
  const name = cli.takeOpt("name");
  const heading = cli.takeOpt("heading");
  const body = cli.takeOpt("body");
  const logo = cli.takeOpt("logo");
  const keywords = cli.takeOpt("keywords");
  if (name != null) patch.name = name;
  if (logo != null) patch.logoPath = logo || null;
  if (keywords != null) {
    patch.styleKeywords = keywords.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  }
  const colors = {};
  for (const key of ["primary", "secondary", "accent", "background", "surface", "text"]) {
    const val = cli.takeOpt(key);
    if (val != null) colors[key] = val;
  }
  if (Object.keys(colors).length) patch.colors = colors;
  const fonts = {};
  if (heading != null) fonts.heading = heading;
  if (body != null) fonts.body = body;
  if (Object.keys(fonts).length) patch.fonts = fonts;
  if (Object.keys(patch).length === 0) {
    cli.die("brand set --name --primary --accent --background --text --heading --body --logo --keywords");
  }
  if (!http) cli.die("brand set requires the running app (npm run dev)");
  const updated = await cli.api("PUT", "/api/brand", patch);
  cli.print(updated, `Brand saved${updated.name ? `: ${updated.name}` : ""}`);
}

async function cmdBrandApply(http) {
  const id = cli.args.shift();
  if (!id) cli.die("brand apply <carouselId>");
  if (!http) cli.die("brand apply requires the running app (npm run dev)");
  const updated = await cli.api("POST", `/api/carousels/${id}/restyle`, {});
  cli.print(updated, `Restyled ${updated.restyled} slides with current brand`);
}

async function cmdTemplates(http) {
  const sub = cli.args.shift() || "list";
  if (!http) cli.die("templates requires the running app (npm run dev)");
  if (sub === "list") {
    const data = await cli.api("GET", "/api/templates");
    const templates = data.templates || [];
    cli.print(
      templates,
      templates.length === 0
        ? "(no templates)"
        : templates.map((t) => `${t.id}  ${t.aspectRatio}  ${t.slides?.length ?? 0} slides  ${t.name}`).join("\n")
    );
    return;
  }
  if (sub === "save") {
    const carouselId = cli.args.shift();
    if (!carouselId) cli.die("templates save <carouselId> [--name] [--description]");
    const saved = await cli.api("POST", "/api/templates", {
      carouselId,
      name: cli.takeOpt("name"),
      description: cli.takeOpt("description"),
    });
    cli.print(saved, `Template saved ${saved.id}  ${saved.name}`);
    return;
  }
  if (sub === "use") {
    const templateId = cli.args.shift();
    if (!templateId) cli.die("templates use <templateId>");
    const created = await cli.api("POST", `/api/templates/${templateId}/use`);
    cli.print(created, `Created ${created.id} from template\nEditor: ${cli.BASE}/carousel/${created.id}`);
    return;
  }
  cli.die('templates <list|save|use>');
}

async function cmdPresets(http) {
  const sub = cli.args.shift() || "list";
  if (!http) cli.die("presets requires the running app (npm run dev)");
  if (sub === "list") {
    const data = await cli.api("GET", "/api/style-presets");
    const presets = data.presets || [];
    cli.print(
      presets,
      presets.length === 0
        ? "(no presets)"
        : presets.map((p) => `${p.id}  ${p.name}${p.description ? `  — ${p.description}` : ""}`).join("\n")
    );
    return;
  }
  if (sub === "apply") {
    const presetId = cli.args.shift();
    if (!presetId) cli.die("presets apply <presetId> [--carousel id]");
    const applied = await cli.api("POST", `/api/style-presets/${presetId}/apply`);
    const carouselId = cli.takeOpt("carousel");
    if (carouselId) {
      await cli.api("POST", `/api/carousels/${carouselId}/restyle`, {});
    }
    cli.print(applied, `Preset applied${applied.preset?.name ? `: ${applied.preset.name}` : ""}`);
    return;
  }
  cli.die("presets <list|apply>");
}

async function cmdUpload(http) {
  if (!http) cli.die("upload requires the running app (npm run dev)");
  const file = cli.args.shift();
  if (!file) cli.die("upload <image.png>");
  const abs = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  if (!existsSync(abs)) cli.die(`file not found: ${abs}`);
  const buf = await readFile(abs);
  const form = new FormData();
  const blob = new Blob([buf]);
  form.append("file", blob, path.basename(abs));
  const res = await fetch(`${cli.BASE}/api/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) cli.die(data.error || `HTTP ${res.status}`);
  cli.print(data, `Uploaded ${data.url}`);
}

async function cmdDuplicate(http) {
  const id = cli.args.shift();
  if (!id) cli.die("duplicate <carouselId>");
  if (!http) cli.die("duplicate requires the running app (npm run dev)");
  const copy = await cli.api("POST", `/api/carousels/${id}/duplicate`);
  cli.print(copy, `Duplicated → ${copy.id}\nEditor: ${cli.BASE}/carousel/${copy.id}`);
}

async function cmdPlaybook() {
  const fileArg =
    cli.args[0] && !cli.args[0].startsWith("--")
      ? cli.args.shift()
      : "docs/publicacion.md";
  const abs = path.isAbsolute(fileArg)
    ? fileArg
    : path.resolve(cli.ROOT, fileArg);
  if (!existsSync(abs)) cli.die(`playbook not found: ${abs}`);
  const text = await readFile(abs, "utf-8");
  cli.print({ file: abs, markdown: text }, text);
}

async function cmdPalette(http) {
  if (!http) cli.die("palette requires the running app (npm run dev)");
  const id = cli.args.shift();
  if (!id) cli.die("palette <carouselId> [--primary] [--accent] [--background] [--text] | palette clear <id>");
  if (id === "clear") {
    const carouselId = cli.args.shift();
    if (!carouselId) cli.die("palette clear <carouselId>");
    const cleared = await cli.api("PUT", `/api/carousels/${carouselId}/palette`, {
      palette: null,
      apply: true,
    });
    cli.print(cleared, `Palette cleared on ${carouselId} (using global brand)`);
    return;
  }
  const patch = {};
  for (const key of ["primary", "secondary", "accent", "background", "surface", "text"]) {
    const val = cli.takeOpt(key);
    if (val != null) patch[key] = val;
  }
  if (Object.keys(patch).length === 0) {
    const current = await cli.api("GET", `/api/carousels/${id}/palette`);
    cli.print(
      current,
      current.palette
        ? `Palette for ${id}:\n${JSON.stringify(current.palette, null, 2)}\nEffective: ${JSON.stringify(current.effective, null, 2)}`
        : `No carousel palette on ${id} (using global brand)\nEffective: ${JSON.stringify(current.effective, null, 2)}`
    );
    return;
  }
  const updated = await cli.api("PUT", `/api/carousels/${id}/palette`, {
    palette: patch,
    apply: true,
  });
  cli.print(
    updated,
    `Palette saved on ${id} · restyled ${updated.restyled ?? 0} slides`
  );
}

async function cmdHook(http) {
  if (!http) cli.die("hook requires the running app (npm run dev)");
  const sub = cli.args.shift();
  if (sub === "variants" || sub === "generate") {
    const id = cli.args.shift();
    if (!id) cli.die("hook variants <carouselId> [--title \"...\"]");
    const title = cli.takeOpt("title");
    const body = cli.takeOpt("body");
    const titlesRaw = cli.takeOpt("titles");
    const payload = {};
    if (title) payload.title = title;
    if (body) payload.body = body;
    if (titlesRaw) {
      payload.titles = titlesRaw.split("|").map((s) => s.trim()).filter(Boolean);
    }
    const data = await cli.api("POST", `/api/carousels/${id}/hooks`, payload);
    const lines = (data.variants || [])
      .map(
        (v, i) =>
          `${i + 1}. [${v.style}] ${v.title}${v.body ? ` — ${v.body}` : ""}`
      )
      .join("\n");
    cli.print(
      data,
      `3 hook variants saved on ${id}:\n${lines}\n\nPick (persists; switch anytime):\n  pnpm oc -- hook pick ${id} 1`
    );
    return;
  }
  if (sub === "pick") {
    const id = cli.args.shift();
    const which = cli.args.shift();
    if (!id || !which) cli.die("hook pick <carouselId> <1|2|3>");
    const index = Number(which) - 1;
    if (![0, 1, 2].includes(index)) cli.die("hook pick index must be 1, 2, or 3");
    const data = await cli.api("PUT", `/api/carousels/${id}/hooks`, { index });
    cli.print(
      data,
      `Picked hook: ${data.picked?.title || which}\nApplied to slide ${data.slideId}\nVariants kept — switch anytime with: pnpm oc -- hook pick ${id} 1|2|3`
    );
    return;
  }
  cli.die("hook <variants|pick> …");
}

async function cmdSchedule(http) {
  if (!http) cli.die("schedule requires the running app (npm run dev)");
  const sub = cli.args[0];
  if (!sub || sub === "list") {
    if (sub === "list") cli.args.shift();
    const data = await cli.api("GET", "/api/schedule");
    const lines = (data.queue || [])
      .map((q) => {
        const when = q.scheduledAt
          ? new Date(q.scheduledAt).toLocaleString()
          : "—";
        const mark = q.ready ? "✓" : "○";
        return `${mark} ${q.id}  ${q.publishStatus.padEnd(10)}  ${when}  ${q.name}`;
      })
      .join("\n");
    cli.print(
      data,
      lines
        ? `Cola de publicación\n${lines}`
        : "Cola vacía — completa caption + export y programa una fecha"
    );
    return;
  }
  if (sub === "clear") {
    cli.args.shift();
    const id = cli.args.shift();
    if (!id) cli.die("schedule clear <carouselId>");
    const data = await cli.api("PUT", "/api/schedule", {
      carouselId: id,
      clear: true,
    });
    cli.print(data, `Schedule cleared on ${id}`);
    return;
  }
  if (sub === "status") {
    cli.args.shift();
    const id = cli.args.shift();
    const status = cli.args.shift();
    if (!id || !status) {
      cli.die("schedule status <carouselId> <draft|ready|scheduled|published>");
    }
    const data = await cli.api("PUT", "/api/schedule", {
      carouselId: id,
      publishStatus: status,
    });
    cli.print(data, `Status → ${status} on ${id}`);
    return;
  }
  // schedule <id> --at ISO|local
  const id = cli.args.shift();
  const at = cli.takeOpt("at") || cli.takeOpt("when");
  if (!id || !at) {
    cli.die(
      'schedule list | schedule <id> --at "2026-08-20T18:00" | schedule clear <id> | schedule status <id> ready'
    );
  }
  const scheduledAt = new Date(at).toISOString();
  if (Number.isNaN(Date.parse(scheduledAt))) cli.die(`invalid --at date: ${at}`);
  const data = await cli.api("PUT", "/api/schedule", {
    carouselId: id,
    scheduledAt,
  });
  cli.print(
    data,
    `Scheduled ${id} → ${new Date(scheduledAt).toLocaleString()}`
  );
}

async function cmdLibrary(http) {
  if (!http) cli.die("library requires the running app (npm run dev)");
  const sub = cli.args.shift() || "list";
  if (sub === "list") {
    const data = await cli.api("GET", "/api/layout-library");
    const lines = (data.layouts || [])
      .map((l) => `${l.id.padEnd(28)}  ${l.layout.padEnd(8)}  ${l.aspectRatio}  ${l.name}`)
      .join("\n");
    cli.print(data, lines || "Biblioteca vacía");
    return;
  }
  if (sub === "reseed") {
    const data = await cli.api("GET", "/api/layout-library?reseed=1");
    cli.print(
      data,
      `Reseeded ${(data.layouts || []).length} XookTech layouts`
    );
    return;
  }
  if (sub === "apply") {
    const layoutId = cli.args.shift();
    const carouselId = cli.args.shift();
    if (!layoutId || !carouselId) {
      cli.die("library apply <layoutId> <carouselId> [--slide id] [--add]");
    }
    const slideId = cli.takeOpt("slide");
    const add = cli.takeFlag("add");
    const data = await cli.api("POST", "/api/layout-library", {
      layoutId,
      carouselId,
      slideId: add ? undefined : slideId,
      mode: add || !slideId ? "add" : "replace",
    });
    cli.print(
      data,
      add || !slideId
        ? `Added layout ${layoutId} as new slide on ${carouselId}`
        : `Applied layout ${layoutId} to slide ${slideId}`
    );
    return;
  }
  cli.die("library list | library apply <layoutId> <carouselId> [--slide id|--add] | library reseed");
}

async function cmdReview(http) {
  const id = cli.args.shift();
  if (!id) cli.die("review <carouselId>");
  if (http) {
    const data = await cli.api("GET", `/api/carousels/${id}/review`);
    cli.print(data, data.report || formatReviewReport(data));
    return;
  }
  const store = await cli.loadStore();
  const carousel = store.carousels.find((c) => c.id === id);
  if (!carousel) cli.die(`carousel not found: ${id}`);
  // hydrate html from files
  const slides = [];
  for (const s of carousel.slides || []) {
    const file = cli.slideFile(id, s.id);
    let html = s.html;
    if (existsSync(file)) html = await readFile(file, "utf-8");
    slides.push({ ...s, html });
  }
  const result = reviewCarousel({ ...carousel, slides });
  cli.print(result, formatReviewReport(result));
}

async function cmdImport(http) {
  if (!http) cli.die("import requires the running app (npm run dev)");
  const compose = cli.takeFlag("compose");
  const out = cli.takeOpt("out");
  const textOpt = cli.takeOpt("text");
  const peek = cli.args[0];

  let data;
  if (textOpt != null) {
    data = await cli.api("POST", "/api/import", {
      text: textOpt,
      compose,
      name: cli.takeOpt("name"),
      ratio: cli.takeOpt("ratio"),
    });
  } else if (peek && /\.pdf$/i.test(peek)) {
    cli.args.shift();
    const abs = path.isAbsolute(peek) ? peek : path.resolve(process.cwd(), peek);
    if (!existsSync(abs)) cli.die(`PDF not found: ${abs}`);
    const buf = await readFile(abs);
    const FormData = (await import("node:buffer")).Blob
      ? globalThis.FormData
      : null;
    // Use fetch multipart via undici/native FormData
    const form = new FormData();
    form.append(
      "file",
      new Blob([buf], { type: "application/pdf" }),
      path.basename(abs)
    );
    form.append("compose", compose ? "true" : "false");
    const name = cli.takeOpt("name");
    if (name) form.append("name", name);
    const ratio = cli.takeOpt("ratio");
    if (ratio) form.append("ratio", ratio);
    const res = await fetch(`${process.env.OC_API || "http://localhost:3000"}/api/import`, {
      method: "POST",
      body: form,
    });
    data = await res.json();
    if (!res.ok) cli.die(data.error || `import failed (${res.status})`);
  } else if (peek && /^https?:\/\//i.test(peek)) {
    cli.args.shift();
    data = await cli.api("POST", "/api/import", {
      url: peek,
      compose,
      name: cli.takeOpt("name"),
      ratio: cli.takeOpt("ratio"),
    });
  } else {
    cli.die(
      'import <url|file.pdf> [--compose] [--out brief.md]\nimport --text "..." [--compose]'
    );
  }

  if (out && data.markdown) {
    const abs = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
    await writeFile(abs, data.markdown, "utf-8");
  }

  const lines = [
    `Import ${data.kind} ← ${data.source}`,
    data.briefPath ? `Brief: ${data.briefPath}` : null,
    out ? `Copied to: ${out}` : null,
    data.carousel?.id
      ? `Carousel: ${data.carousel.id} — http://localhost:3000/carousel/${data.carousel.id}`
      : "Use --compose to create the carousel, or:\n  pnpm oc -- compose " +
        (data.briefPath || "data/briefs/….md"),
  ].filter(Boolean);
  cli.print(data, lines.join("\n"));
}

function cmdLayouts() {
  cli.print(
    LAYOUT_IDS,
    `Layouts: ${LAYOUT_IDS.join(", ")}\n\n` +
      `npm run oc -- slide add <id> --layout hook --title "..." --body "..." --kicker "..."\n` +
      `npm run oc -- compose --name "..." --topic "..." --points "Uno|Dos|Tres" --cta "Guarda esto"`
  );
}

async function cmdDoctor() {
  const doctor = path.join(cli.ROOT, "scripts", "doctor.mjs");
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [doctor], {
      stdio: "inherit",
      cwd: cli.ROOT,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`doctor exited ${code}`));
    });
    child.on("error", reject);
  });
}

export async function exportWithOptions(http, id) {
  const slide = cli.takeOpt("slide");
  const format = cli.takeOpt("format") || "png";
  const qualityRaw = cli.takeOpt("quality");
  const naming = cli.takeOpt("naming") || "index";
  const out = cli.takeOpt("out");
  const body = {
    format: format === "jpg" || format === "jpeg" ? "jpg" : "png",
    naming,
  };
  if (qualityRaw) body.quality = Number(qualityRaw);
  if (slide) body.slideIds = [slide];

  const res = await cli.api("POST", `/api/carousels/${id}/export`, body, true);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") || "";
  const defaultName = type.includes("zip")
    ? `carousel-${id}.zip`
    : `slide-${id}.${body.format}`;
  const outfile = out
    ? path.resolve(process.cwd(), out)
    : path.join(process.cwd(), defaultName);
  await writeFile(outfile, buf);
  cli.print({ file: outfile, bytes: buf.length }, `Exported ${outfile} (${buf.length} bytes)`);
}
