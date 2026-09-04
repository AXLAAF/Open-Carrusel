import { test } from "node:test";
import assert from "node:assert/strict";
import { resizeSlideHtml, renderLayout } from "../../scripts/lib/layouts.mjs";
import {
  resolveForeground,
  isDarkBackground,
} from "../../scripts/lib/color-contrast.mjs";

test("dark gradient gets white text", () => {
  const bg = "linear-gradient(135deg, #1B2B6B 0%, #2D4BD4 50%, #00D4FF 100%)";
  assert.equal(isDarkBackground(bg), true);
  assert.equal(resolveForeground(bg, { primary: "#1B2B6B" }), "#ffffff");
});

test("explicit text wins over primary", () => {
  assert.equal(
    resolveForeground("#ffffff", { text: "#ff0000", primary: "#1a1a2e" }),
    "#ff0000"
  );
});

test("light solid bg keeps dark text", () => {
  assert.equal(isDarkBackground("#ffffff"), false);
  assert.equal(resolveForeground("#ffffff", { primary: "#1a1a2e" }), "#1a1a2e");
});

test("resizeSlideHtml updates width and height", () => {
  const html =
    '<div class="oc-slide" data-oc-layout="hook" style="width:1080px;height:1080px;color:#fff">x</div>';
  const next = resizeSlideHtml(html, "4:5");
  assert.match(next, /width:1080px/);
  assert.match(next, /height:1350px/);
  const story = resizeSlideHtml(next, "9:16");
  assert.match(story, /height:1920px/);
});

test("xook brand with gradient background keeps white text", () => {
  const brand = {
    name: "XookTech",
    colors: {
      primary: "#1B2B6B",
      accent: "#00D4FF",
      background: "linear-gradient(135deg, #1B2B6B 0%, #2D4BD4 50%, #00D4FF 100%)",
    },
    fonts: { heading: "Borscha", body: "Rostex" },
  };
  const html = renderLayout("hook", { title: "Hola" }, brand, "4:5");
  assert.match(html, /color:#ffffff/);
  assert.doesNotMatch(html, /color:#1B2B6B/);
  assert.match(html, /width:1080px;height:1350px/);
});

test("compose with text override paints white", () => {
  const brand = {
    name: "Test",
    colors: {
      primary: "#111111",
      accent: "#e94560",
      background: "#0a0a0a",
      text: "#ffffff",
    },
    fonts: { heading: "Borscha", body: "Rostex" },
  };
  const html = renderLayout("value", { title: "Ok" }, brand, "9:16");
  assert.match(html, /height:1920px/);
  assert.match(html, /color:#ffffff/);
});
