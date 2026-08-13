"use client";

import {
  Type,
  Layers,
  Palette,
  Image as ImageIcon,
  History,
  Share2,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignPanel } from "./DesignPanel";
import { LayersPanel } from "./LayersPanel";
import { BrandStudioPanel } from "./BrandStudioPanel";
import { MediaPanel } from "./MediaPanel";
import { HistoryPanel } from "./HistoryPanel";
import { PublishPanel } from "./PublishPanel";
import { SlideInspector } from "@/components/editor/SlideInspector";
import { setRootStyle } from "@/lib/slide-fields";
import type { Carousel, Slide } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";

export type StudioTab =
  | "design"
  | "layers"
  | "brand"
  | "media"
  | "history"
  | "publish"
  | "html";

const TABS: { id: StudioTab; label: string; icon: typeof Type }[] = [
  { id: "design", label: "Diseño", icon: Type },
  { id: "layers", label: "Capas", icon: Layers },
  { id: "brand", label: "Marca", icon: Palette },
  { id: "media", label: "Medios", icon: ImageIcon },
  { id: "history", label: "Historial", icon: History },
  { id: "publish", label: "Publicar", icon: Share2 },
  { id: "html", label: "HTML", icon: Code2 },
];

interface StudioPanelProps {
  tab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  carousel: Carousel;
  slide: Slide | null;
  slideIndex: number;
  html: string;
  brand: BrandConfig | null;
  onHtmlChange: (html: string) => void;
  onSaved: () => void;
  onBrandSaved: (brand: BrandConfig) => void;
  onRestyle: () => void;
  onRestore: (html: string) => void;
  onFullscreen: () => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
}

export function StudioPanel({
  tab,
  onTabChange,
  carousel,
  slide,
  slideIndex,
  html,
  brand,
  onHtmlChange,
  onSaved,
  onBrandSaved,
  onRestyle,
  onRestore,
  onFullscreen,
  showSafeZones,
  onToggleSafeZones,
}: StudioPanelProps) {
  return (
    <div className="h-full flex min-h-0">
      <div className="w-11 border-r border-border flex flex-col items-center py-2 gap-1 shrink-0">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "h-8 w-8 rounded-md inline-flex items-center justify-center",
                active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="px-3 py-2 border-b border-border text-xs font-semibold shrink-0">
          {TABS.find((t) => t.id === tab)?.label}
        </div>
        {tab === "design" && (
          <DesignPanel
            key={slide?.id ?? "empty"}
            html={html}
            brand={brand}
            aspectRatio={carousel.aspectRatio}
            onChange={onHtmlChange}
          />
        )}
        {tab === "layers" && <LayersPanel html={html} onChange={onHtmlChange} />}
        {tab === "brand" && (
          <BrandStudioPanel onBrandSaved={onBrandSaved} onRestyle={onRestyle} />
        )}
        {tab === "media" && (
          <MediaPanel
            onUseBackground={(url) =>
              onHtmlChange(
                setRootStyle(html, {
                  "background-image": `url('${url}')`,
                  "background-size": "cover",
                  "background-position": "center",
                })
              )
            }
          />
        )}
        {tab === "history" && <HistoryPanel slide={slide} onRestore={onRestore} />}
        {tab === "publish" && (
          <PublishPanel
            carousel={carousel}
            onFullscreen={onFullscreen}
            showSafeZones={showSafeZones}
            onToggleSafeZones={onToggleSafeZones}
          />
        )}
        {tab === "html" && (
          <SlideInspector
            carouselId={carousel.id}
            slide={slide}
            slideIndex={slideIndex}
            onSaved={onSaved}
          />
        )}
      </div>
    </div>
  );
}
