#!/usr/bin/env node
// Cross-platform setup for Open Carrusel. Runs on macOS, Linux, and Windows.

import fs from "node:fs";
import path from "node:path";
import crossSpawn from "cross-spawn";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");

function log(msg) {
  process.stdout.write(msg + "\n");
}

function runSync(cmd, args, opts = {}) {
  const res = crossSpawn.sync(cmd, args, { stdio: "inherit", ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited with ${res.status}`);
  }
}

function readEnvFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function parseEnvValue(contents, name) {
  const match = contents.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "") || "";
}

function ensureCursorEnv() {
  const existing = readEnvFile(ENV_PATH);
  const envKey = process.env.CURSOR_API_KEY?.trim() || "";
  const fileKey = parseEnvValue(existing, "CURSOR_API_KEY");
  const key = envKey || fileKey;

  let lines = existing
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" || existing.length === 0);

  const hasKeyLine = lines.some((line) => line.startsWith("CURSOR_API_KEY="));
  if (!hasKeyLine) {
    if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
    lines.push("# Get a key at https://cursor.com/dashboard/integrations");
    lines.push(`CURSOR_API_KEY=${key}`);
  } else if (envKey) {
    lines = lines.map((line) =>
      line.startsWith("CURSOR_API_KEY=") ? `CURSOR_API_KEY=${envKey}` : line
    );
  }

  fs.writeFileSync(ENV_PATH, lines.join("\n").replace(/\n*$/, "\n"), "utf-8");
  return Boolean(key);
}

function seedDataFiles() {
  const dataDir = path.join(ROOT, "data");
  const uploadsDir = path.join(ROOT, "public", "uploads");
  const exportsDir = path.join(dataDir, "exports");
  const fontCacheDir = path.join(dataDir, ".font-cache");

  for (const dir of [dataDir, uploadsDir, exportsDir, fontCacheDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const seeds = {
    "brand.json": {
      name: "",
      colors: {
        primary: "#1a1a2e",
        secondary: "#16213e",
        accent: "#e94560",
        background: "#ffffff",
        surface: "#f5f5f5",
      },
      fonts: { heading: "Inter", body: "Inter" },
      customFonts: [],
      logoPath: null,
      styleKeywords: [],
      createdAt: "",
      updatedAt: "",
    },
    "carousels.json": { carousels: [] },
    "templates.json": { templates: [] },
    "staged-actions.json": { actions: [] },
    "style-presets.json": { presets: [] },
  };

  for (const [name, contents] of Object.entries(seeds)) {
    const filePath = path.join(dataDir, name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(contents), "utf-8");
      log(`  Created ${path.relative(ROOT, filePath)}`);
    }
  }
}

async function main() {
  log("Setting up Open Carrusel...");
  log("");

  log(
    "Installing dependencies (first run may download Chromium ~300MB for PNG export)..."
  );
  runSync("pnpm", ["install"]);
  log("");

  log("Creating data directories...");
  seedDataFiles();
  log("");

  log("Checking Cursor API key...");
  const hasKey = ensureCursorEnv();
  if (hasKey) {
    log("  Found CURSOR_API_KEY in environment or .env.local");
  } else {
    log("  CURSOR_API_KEY is empty.");
    log("  In-app chat needs a key from https://cursor.com/dashboard/integrations");
    log("  Set CURSOR_API_KEY in .env.local, then restart the dev server.");
    log("  The editor and `pnpm oc` still work without it.");
  }
  log("");

  if (process.env.OC_SETUP_NO_DEV) {
    log("Setup complete. (Dev server start skipped — caller will handle it.)");
    return;
  }

  log("Starting Open Carrusel...");
  log("  Open http://localhost:3000 in your browser");
  log("");
  runSync("pnpm", ["dev"]);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
