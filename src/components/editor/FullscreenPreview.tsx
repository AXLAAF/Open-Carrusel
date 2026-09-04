"use client";

import { useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideRenderer } from "./SlideRenderer";
import type { Slide, AspectRatio } from "@/types/carousel";

interface FullscreenPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: Slide[];
  aspectRatio: AspectRatio;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  username?: string;
  caption?: string;
  hashtags?: string[];
}

export function FullscreenPreview({
  open,
  onOpenChange,
  slides,
  aspectRatio,
  activeIndex,
  onActiveChange,
  username = "marca",
  caption = "",
  hashtags = [],
}: FullscreenPreviewProps) {
  const slide = slides[activeIndex];
  const handle = username.replace(/\s+/g, "").slice(0, 22) || "marca";
  const isStory = aspectRatio === "9:16";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || el?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowLeft" && activeIndex > 0) onActiveChange(activeIndex - 1);
      else if (e.key === "ArrowRight" && activeIndex < slides.length - 1) {
        onActiveChange(activeIndex + 1);
      }
    },
    [activeIndex, slides.length, onActiveChange]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
              aria-label="Cerrar vista Instagram"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onActiveChange(activeIndex - 1)}
            disabled={activeIndex <= 0}
            className="absolute left-3 z-10 text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 h-11 w-11 hidden sm:inline-flex"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="w-[min(100%,420px)] max-h-[92vh] overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-2xl flex flex-col">
            {!isStory && (
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="h-full w-full rounded-full bg-neutral-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{handle}</p>
                  <p className="text-white/40 text-[10px]">Carrusel · {aspectRatio}</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-white/70" />
              </div>
            )}

            <div
              className="relative bg-neutral-950 w-full"
              style={{ aspectRatio: aspectRatio.replace(":", " / ") }}
            >
              {isStory && (
                <div className="absolute top-0 inset-x-0 z-10 px-3 pt-3 flex gap-1">
                  {slides.map((_, i) => (
                    <div key={i} className="h-0.5 flex-1 rounded-full bg-white/25 overflow-hidden">
                      <div
                        className="h-full bg-white"
                        style={{
                          width: i <= activeIndex ? "100%" : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {slide && (
                <SlideRenderer
                  html={slide.html}
                  aspectRatio={aspectRatio}
                  className="absolute inset-0"
                  style={{ width: "100%", height: "100%", borderRadius: 0 }}
                />
              )}
              {slides.length > 1 && !isStory && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onActiveChange(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeIndex ? "w-4 bg-sky-400" : "w-1.5 bg-white/50"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isStory && (
              <div className="px-3 py-2.5 space-y-2 shrink-0 text-white">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5" />
                  <MessageCircle className="h-5 w-5" />
                  <Send className="h-5 w-5" />
                  <span className="flex-1" />
                  <Bookmark className="h-5 w-5" />
                </div>
                <p className="text-[11px] text-white/50">
                  {activeIndex + 1} / {slides.length} · desliza ← →
                </p>
                {(caption.trim() || hashtags.length > 0) && (
                  <p className="text-xs leading-relaxed">
                    <span className="font-semibold mr-1">{handle}</span>
                    {caption.trim()}{" "}
                    {hashtags.map((h) => (
                      <span key={h} className="text-sky-300">
                        #{h}{" "}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onActiveChange(activeIndex + 1)}
            disabled={activeIndex >= slides.length - 1}
            className="absolute right-3 z-10 text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 h-11 w-11 hidden sm:inline-flex"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <Dialog.Title className="sr-only">Vista Instagram</Dialog.Title>
          <Dialog.Description className="sr-only">
            Slide {activeIndex + 1} de {slides.length}. F cierra o Escape.
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
