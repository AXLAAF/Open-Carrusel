import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, MIN_CONTRAST } from "./color-contrast.mjs";
import { reviewCarousel } from "./slide-review.mjs";
import { briefFromText, briefToMarkdown } from "./brief-from-text.mjs";

describe("contrastRatio", () => {
  it("white on black is high", () => {
    const r = contrastRatio("#ffffff", "#000000");
    assert.ok(r != null && r > 20);
  });
  it("gray on white fails AA", () => {
    const r = contrastRatio("#999999", "#ffffff");
    assert.ok(r != null && r < MIN_CONTRAST);
  });
});

describe("reviewCarousel", () => {
  it("flags long hook and missing cta", () => {
    const carousel = {
      slides: [
        {
          id: "a",
          notes: "hook",
          html: `<div data-oc-layout="hook" style="padding: 40px; background: #000000; color: #ffffff"><h1 data-oc-field="title" style="color: #ffffff">This hook has way too many words for Instagram</h1></div>`,
        },
        {
          id: "b",
          notes: "value",
          html: `<div data-oc-layout="value" style="padding: 80px; background: #000000; color: #ffffff"><h2 data-oc-field="title" style="color: #ffffff">Ok</h2></div>`,
        },
      ],
    };
    const result = reviewCarousel(carousel);
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.id === "hook-words" && !i.ok));
    assert.ok(result.issues.some((i) => i.id === "cta-last" && !i.ok));
    assert.ok(result.issues.some((i) => i.id.startsWith("padding-a") && !i.ok));
  });

  it("passes clean carousel", () => {
    const carousel = {
      slides: [
        {
          id: "a",
          notes: "hook",
          html: `<div data-oc-layout="hook" style="padding: 80px; background: #111111; color: #ffffff"><h1 data-oc-field="title" style="color: #ffffff">Hook corto aquí</h1></div>`,
        },
        {
          id: "b",
          notes: "cta",
          html: `<div data-oc-layout="cta" style="padding: 96px; background: #111111; color: #ffffff"><h1 data-oc-field="title" style="color: #ffffff">Guarda esto</h1></div>`,
        },
      ],
    };
    const result = reviewCarousel(carousel);
    assert.equal(result.ok, true);
    assert.ok(result.score >= 80);
  });
});

describe("briefFromText", () => {
  it("builds markdown brief from bullets", () => {
    const brief = briefFromText(
      "5 errores al publicar\n\n- Hook débil\n- Texto largo\n- Sin CTA\n\nGuarda esto ahora",
      { sourceLabel: "Web" }
    );
    assert.ok(brief.name.includes("errores") || brief.topic);
    assert.ok(brief.points.length >= 2);
    assert.equal(brief.cta.toLowerCase().includes("guarda") || brief.cta === "Guarda esto", true);
    const md = briefToMarkdown(brief);
    assert.match(md, /^# /m);
    assert.match(md, /## Points/);
  });
});
