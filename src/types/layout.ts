import type { AspectRatio } from "./carousel";

export const LAYOUT_IDS = [
  "hook",
  "setup",
  "value",
  "list",
  "quote",
  "stat",
  "summary",
  "cta",
] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

export function isLayoutId(value: string): value is LayoutId {
  return (LAYOUT_IDS as readonly string[]).includes(value);
}

export const LAYOUT_LABELS: Record<LayoutId, string> = {
  hook: "Hook",
  setup: "Contexto",
  value: "Valor",
  list: "Lista",
  quote: "Cita",
  stat: "Dato",
  summary: "Resumen",
  cta: "CTA",
};

export interface SlideFields {
  kicker?: string;
  title?: string;
  body?: string;
  footer?: string;
  quote?: string;
  author?: string;
  stat?: string;
  label?: string;
  items?: string[];
}

export interface SlideSpec extends SlideFields {
  layout: LayoutId;
  notes?: string;
}

export interface CarouselBrief {
  name: string;
  ratio?: AspectRatio;
  caption?: string;
  hashtags?: string[];
  topic?: string;
  points?: string[];
  cta?: string;
  kicker?: string;
  footer?: string;
  slides?: SlideSpec[];
  /** One-shot palette for this compose (does not rewrite brand.json). */
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
  };
}
