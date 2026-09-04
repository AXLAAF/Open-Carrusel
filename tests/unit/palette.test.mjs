import { test } from "node:test";
import assert from "node:assert/strict";

// Inline mirror of sanitizePalette / merge logic for unit test without TS loader
function sanitizePalette(input) {
  if (input === null) return null;
  if (!input || typeof input !== "object") return null;
  const out = {};
  for (const key of ["primary", "secondary", "accent", "background", "surface", "text"]) {
    const val = input[key];
    if (typeof val === "string" && val.trim()) out[key] = val.trim();
  }
  return Object.keys(out).length ? out : null;
}

function mergeBrandWithPalette(brand, palette) {
  if (!palette || Object.keys(palette).length === 0) return brand;
  return {
    ...brand,
    colors: { ...brand.colors, ...palette },
  };
}

test("sanitizePalette keeps only color keys", () => {
  const p = sanitizePalette({
    background: "#111",
    text: "#fff",
    junk: "no",
    accent: "  #e94560  ",
  });
  assert.deepEqual(p, {
    background: "#111",
    text: "#fff",
    accent: "#e94560",
  });
});

test("mergeBrandWithPalette lets carousel win", () => {
  const brand = {
    name: "Xook",
    colors: { primary: "#1a1a2e", accent: "#e94560", background: "#ffffff" },
  };
  const merged = mergeBrandWithPalette(brand, {
    background: "#0a0a0a",
    text: "#ffffff",
  });
  assert.equal(merged.colors.background, "#0a0a0a");
  assert.equal(merged.colors.text, "#ffffff");
  assert.equal(merged.colors.accent, "#e94560");
  assert.equal(brand.colors.background, "#ffffff");
});
