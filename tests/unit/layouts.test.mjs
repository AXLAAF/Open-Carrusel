import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LAYOUT_IDS,
  renderLayout,
  slidesFromBrief,
  isLayoutId,
} from "../../scripts/lib/layouts.mjs";

const brand = {
  name: "XookTech",
  colors: { primary: "#ffffff", accent: "#00D4FF", background: "#ffffff" },
  fonts: { heading: "Borscha", body: "Rostex" },
};

test("layouts are complete", () => {
  for (const id of LAYOUT_IDS) {
    assert.equal(isLayoutId(id), true);
    const html = renderLayout(id, {}, brand, "4:5");
    assert.match(html, /data-oc-layout="/);
    assert.match(html, /data-oc-field="/);
    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /<!DOCTYPE/i);
    assert.match(html, /font-family:'/);
    assert.doesNotMatch(html, /style="[^"]*font-family:"/);
  }
});

test("compose from topic builds hook + cta", () => {
  const slides = slidesFromBrief({
    name: "Test",
    topic: "Por qué falla el alcance",
    points: ["Hook débil", "Texto largo", "Sin CTA"],
    cta: "Guarda esto",
  });
  assert.ok(slides.length >= 5);
  assert.equal(slides[0].layout, "hook");
  assert.equal(slides[slides.length - 1].layout, "cta");
  assert.equal(slides[slides.length - 1].title, "Guarda esto");
});

test("explicit slides pass through", () => {
  const slides = slidesFromBrief({
    name: "Manual",
    slides: [
      { layout: "hook", title: "Hola" },
      { layout: "cta", title: "Listo" },
    ],
  });
  assert.equal(slides.length, 2);
  assert.equal(slides[0].title, "Hola");
});
