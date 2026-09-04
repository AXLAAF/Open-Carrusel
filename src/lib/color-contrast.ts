/** Contrast helpers for slide text vs background. */

function expandHex(hex: string): string | null {
  const h = hex.replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(h)) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (/^[0-9a-f]{6}$/i.test(h)) return `#${h}`;
  if (/^[0-9a-f]{8}$/i.test(h)) return `#${h.slice(0, 6)}`;
  return null;
}

/** First usable hex in a solid or gradient background. */
export function firstHex(css: string | undefined | null): string | null {
  if (!css) return null;
  const match = String(css).match(/#([0-9a-f]{3,8})\b/i);
  if (!match) return null;
  return expandHex(`#${match[1]}`);
}

export function relativeLuminance(hex: string): number {
  const full = expandHex(hex);
  if (!full) return 0.5;
  const n = parseInt(full.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function isDarkBackground(css: string | undefined | null): boolean {
  const hex = firstHex(css);
  if (hex) return relativeLuminance(hex) < 0.45;
  const s = String(css || "").toLowerCase();
  if (/black|navy|#0[0-9a-f]|rgb\(\s*0/.test(s)) return true;
  if (/white|#fff|ivory|snow/.test(s)) return false;
  // Gradients without parseable hex: treat as dark (brand default)
  if (/gradient/i.test(s)) return true;
  return false;
}

/**
 * Foreground for slides: explicit text color wins; else white on dark bg,
 * else primary only when it still contrasts; else black/white fallback.
 */
export function resolveForeground(
  background: string | undefined | null,
  opts: { text?: string | null; primary?: string | null } = {}
): string {
  const text = opts.text?.trim();
  if (text) return text;

  const dark = isDarkBackground(background);
  if (dark) return "#ffffff";

  const primary = opts.primary?.trim();
  if (primary) {
    const pHex = firstHex(primary);
    const bHex = firstHex(background) || "#ffffff";
    if (pHex && Math.abs(relativeLuminance(pHex) - relativeLuminance(bHex)) > 0.25) {
      return primary;
    }
  }
  return "#1a1a2e";
}

/** WCAG contrast ratio between two CSS color strings (uses first parseable hex). */
export function contrastRatio(
  foreground: string | undefined | null,
  background: string | undefined | null
): number | null {
  const fg = firstHex(foreground);
  const bg = firstHex(background);
  if (!fg || !bg) return null;
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export const MIN_CONTRAST = 4.5;
export const MIN_PADDING_PX = 80;
export const MAX_HOOK_WORDS = 8;
