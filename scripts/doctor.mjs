#!/usr/bin/env node
// Open Carrusel — environment diagnostic.
// Pure Node, no dependencies, safe to run pre-`npm install`.
// Exit 0 if everything required is OK; exit 1 on any required failure.

import { existsSync, readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { platform } from "node:os";
import { join } from "node:path";

const CHECK = "✓";
const FAIL = "✗";
const INFO = "○";
const WARN = "!";

const checks = [];
let hardFailures = 0;

function add(symbol, label, detail, fatal = false) {
  checks.push({ symbol, label, detail });
  if (fatal && symbol === FAIL) hardFailures += 1;
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function readEnvLocalKey() {
  if (process.env.CURSOR_API_KEY?.trim()) return process.env.CURSOR_API_KEY.trim();
  try {
    const contents = readFileSync(".env.local", "utf-8");
    const match = contents.match(/^CURSOR_API_KEY=(.*)$/m);
    return match?.[1]?.trim().replace(/^["']|["']$/g, "") || "";
  } catch {
    return "";
  }
}

// 1. Node version
const major = Number(process.versions.node.split(".")[0]);
if (major >= 22) {
  add(CHECK, "Node", `v${process.versions.node}`);
} else {
  add(
    FAIL,
    "Node",
    `v${process.versions.node} (need ≥22.13 for Cursor SDK — install from https://nodejs.org)`,
    true
  );
}

// 2. Cursor API key (required for in-app chat)
const cursorKey = readEnvLocalKey();
if (cursorKey) {
  add(CHECK, "Cursor API key", "CURSOR_API_KEY set");
} else {
  add(
    WARN,
    "Cursor API key",
    "missing — in-app chat needs CURSOR_API_KEY in .env.local (https://cursor.com/dashboard/integrations)"
  );
}

// 3. Dependencies
if (existsSync("node_modules") && statSync("node_modules").isDirectory()) {
  add(CHECK, "Dependencies", "node_modules present");
} else {
  add(FAIL, "Dependencies", "node_modules missing — run `pnpm run setup`", true);
}

// 4. Data files
const dataFiles = [
  "brand.json",
  "carousels.json",
  "templates.json",
  "staged-actions.json",
  "style-presets.json",
];
const missingData = dataFiles.filter((f) => !existsSync(join("data", f)));
if (missingData.length === 0) {
  add(CHECK, "Data files", "all 5 seeded");
} else if (missingData.length === dataFiles.length) {
  add(FAIL, "Data files", "none seeded — run `pnpm run setup`", true);
} else {
  add(
    WARN,
    "Data files",
    `${missingData.length} missing: ${missingData.join(", ")} — run pnpm run setup`
  );
}

// 5. Port 3000
let portStatus = "free";
let portFree = true;
if (platform() !== "win32") {
  const pid = tryExec("lsof -ti :3000");
  if (pid) {
    portStatus = `in use by PID ${pid.split("\n")[0]}`;
    portFree = false;
  }
} else {
  const out = tryExec("netstat -ano -p tcp");
  if (out && /:3000\s+.+LISTENING/i.test(out)) {
    portStatus = "in use (run `netstat -ano | findstr :3000` for details)";
    portFree = false;
  }
}
add(portFree ? CHECK : INFO, "Port 3000", portStatus);

if (existsSync("scripts/oc.mjs")) {
  add(CHECK, "CLI (oc)", "pnpm oc -- help");
} else {
  add(WARN, "CLI (oc)", "scripts/oc.mjs missing");
}

const labelWidth = Math.max(...checks.map((c) => c.label.length));
console.log("");
for (const { symbol, label, detail } of checks) {
  console.log(`  ${symbol}  ${label.padEnd(labelWidth)}   ${detail}`);
}
console.log("");

if (hardFailures > 0) {
  console.log(
    `  ${hardFailures} required check${hardFailures > 1 ? "s" : ""} failed.`
  );
  process.exit(1);
} else {
  process.exit(0);
}
