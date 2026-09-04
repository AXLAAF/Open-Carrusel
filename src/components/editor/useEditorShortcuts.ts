"use client";

import { useEffect } from "react";
import type { Carousel, Slide } from "@/types/carousel";
import type { StudioTab } from "@/components/studio/StudioPanel";

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
  onFullscreen: () => void;
  onToggleChat: () => void;
  onFocusChat: () => void;
  onToggleStudio: () => void;
  onStudioTab: (tab: StudioTab) => void;
  onHelp: () => void;
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
  onFullscreen,
  onToggleChat,
  onFocusChat,
  onToggleStudio,
  onStudioTab,
  onHelp,
}: EditorShortcuts) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!carousel) return;
      const meta = e.metaKey || e.ctrlKey;
      if (e.code === "Space" && !isTypingTarget(e.target)) {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        return;
      }
      if (!isTypingTarget(e.target)) {
        if (e.key === "ArrowLeft") onPrev();
        if (e.key === "ArrowRight") onNext();
        if ((e.key === "Delete" || e.key === "Backspace") && current) {
          e.preventDefault();
          onDelete(current.id);
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          onFullscreen();
        }
        if (e.key === "/") {
          e.preventDefault();
          onFocusChat();
        }
        if (e.key === "[") {
          e.preventDefault();
          onToggleChat();
        }
        if (e.key === "]") {
          e.preventDefault();
          onToggleStudio();
        }
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          onStudioTab("html");
        }
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          onStudioTab("publish");
        }
        if (e.key === "?") {
          e.preventDefault();
          onHelp();
        }
      }
      if (isTypingTarget(e.target)) return;
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
    onFullscreen,
    onToggleChat,
    onFocusChat,
    onToggleStudio,
    onStudioTab,
    onHelp,
  ]);
}
