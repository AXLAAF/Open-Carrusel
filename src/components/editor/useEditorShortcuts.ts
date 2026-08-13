"use client";

import { useEffect } from "react";
import type { Carousel, Slide } from "@/types/carousel";

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || el.isContentEditable;
}

interface EditorShortcuts {
  carousel: Carousel | null;
  current: Slide | null;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (slideId: string) => void;
  onDuplicate: (slideId: string) => void;
  onUndo: (slideId: string) => void;
  onRedo: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onActual: () => void;
}

export function useEditorShortcuts({
  carousel,
  current,
  onPrev,
  onNext,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onFit,
  onZoomIn,
  onZoomOut,
  onActual,
}: EditorShortcuts) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!carousel) return;
      const meta = e.metaKey || e.ctrlKey;
      if (e.code === "Space" && !isTypingTarget(e.target)) {
        e.preventDefault();
      }
      if (!isTypingTarget(e.target)) {
        if (e.key === "ArrowLeft") onPrev();
        if (e.key === "ArrowRight") onNext();
        if ((e.key === "Delete" || e.key === "Backspace") && current) {
          e.preventDefault();
          onDelete(current.id);
        }
      }
      if (meta && e.key.toLowerCase() === "d" && current) {
        e.preventDefault();
        void onDuplicate(current.id);
      }
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey && current) {
        e.preventDefault();
        void onUndo(current.id);
      }
      if (meta && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        void onRedo();
      }
      if (meta && (e.key === "0" || e.code === "Digit0")) {
        e.preventDefault();
        onFit();
      }
      if (meta && (e.key === "1" || e.code === "Digit1")) {
        e.preventDefault();
        onActual();
      }
      if (meta && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        onZoomIn();
      }
      if (meta && e.key === "-") {
        e.preventDefault();
        onZoomOut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    carousel,
    current,
    onPrev,
    onNext,
    onDelete,
    onDuplicate,
    onUndo,
    onRedo,
    onFit,
    onZoomIn,
    onZoomOut,
    onActual,
  ]);
}
