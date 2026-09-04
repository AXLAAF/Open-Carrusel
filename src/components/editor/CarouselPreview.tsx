"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideRenderer } from "./SlideRenderer";
import { SafeZoneOverlay } from "./SafeZoneOverlay";
import type { Slide, AspectRatio } from "@/types/carousel";

interface CarouselPreviewProps {
  slides: Slide[];
  aspectRatio: AspectRatio;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  showSafeZones?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  pan?: { x: number; y: number };
  onPanChange?: (pan: { x: number; y: number }) => void;
  editable?: boolean;
  onHtmlChange?: (html: string) => void;
}

export function CarouselPreview({
  slides,
  aspectRatio,
  activeIndex,
  onActiveChange,
  showSafeZones = false,
  zoom = 1,
  onZoomChange,
  pan = { x: 0, y: 0 },
  onPanChange,
  editable = false,
  onHtmlChange,
}: CarouselPreviewProps) {
  const slide = slides[activeIndex];
  const spaceRef = useRef(false);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f0f0f0]">
        <div className="text-center text-muted-foreground p-8">
          <div className="w-16 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl opacity-30">+</span>
          </div>
          <p className="text-sm font-medium">Sin diapositivas</p>
          <p className="text-xs mt-1 max-w-[260px]">
            Pulsa + y elige un layout, usa el CLI (`oc compose`) o edita a mano.
          </p>
        </div>
      </div>
    );
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!spaceRef.current && e.button !== 1) return;
    e.preventDefault();
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setPanning(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !onPanChange) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    onPanChange({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setPanning(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#f0f0f0]">
      <div
        className={`flex-1 relative min-h-0 p-8 px-14 overflow-hidden ${panning ? "cursor-grabbing" : ""}`}
        onWheel={(e) => {
          if (!onZoomChange) return;
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const next = Math.min(4, Math.max(0.25, zoom + (e.deltaY > 0 ? -0.1 : 0.1)));
            onZoomChange(Math.round(next * 10) / 10);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onActiveChange(activeIndex - 1)}
          disabled={activeIndex <= 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-sm hover:bg-white h-9 w-9"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          key={slide.id}
          className="oc-slide-in relative w-full h-full"
          style={
            {
              "--oc-slide-from": "12px",
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            } as CSSProperties
          }
        >
          <SlideRenderer
            html={slide.html}
            aspectRatio={aspectRatio}
            zoom={zoom}
            editable={editable}
            onHtmlChange={onHtmlChange}
            style={{ width: "100%", height: "100%" }}
          />
          <SafeZoneOverlay aspectRatio={aspectRatio} visible={showSafeZones} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onActiveChange(activeIndex + 1)}
          disabled={activeIndex >= slides.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-sm hover:bg-white h-9 w-9"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3 shrink-0">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => onActiveChange(i)}
              className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                i === activeIndex
                  ? "w-6 bg-accent"
                  : "w-2 bg-foreground/20 hover:bg-foreground/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {activeIndex + 1}/{slides.length}
          </span>
        </div>
      )}
      {editable && (
        <p className="text-[10px] text-muted-foreground text-center pb-3">
          Clic en el texto del preview para editar · Diseño/capas a la derecha · CLI: oc make
        </p>
      )}
    </div>
  );
}
