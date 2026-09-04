import { test } from "node:test";
import assert from "node:assert/strict";
import { generateHookVariants } from "./hook-variants.mjs";

test("generates 3 distinct hook styles", () => {
  const variants = generateHookVariants({
    title: "Tu carrusel no convierte",
    body: "Desliza",
  });
  assert.equal(variants.length, 3);
  assert.equal(variants[0].style, "question");
  assert.equal(variants[1].style, "bold");
  assert.equal(variants[2].style, "stat");
  const titles = new Set(variants.map((v) => v.title.toLowerCase()));
  assert.equal(titles.size, 3);
  assert.ok(variants[0].title.includes("?"));
});

test("respects short titles", () => {
  const variants = generateHookVariants({ title: "Hook débil" });
  for (const v of variants) {
    assert.ok(v.title.split(/\s+/).length <= 10);
    assert.ok(v.id);
  }
});

test("guarantees termination and unique titles on long identical prefixes", () => {
  const variants = generateHookVariants({
    title: "uno dos tres cuatro cinco seis siete ocho nueve diez",
  });
  assert.equal(variants.length, 3);
  const titles = new Set(variants.map((v) => v.title.toLowerCase()));
  assert.equal(titles.size, 3);
});
