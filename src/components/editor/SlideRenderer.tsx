"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { wrapSlideHtml } from "@/lib/slide-html";
import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

interface SlideRendererProps {
  html: string;
  aspectRatio: AspectRatio;
  className?: string;
  style?: React.CSSProperties;
  zoom?: number;
  editable?: boolean;
  onHtmlChange?: (html: string) => void;
}

export function SlideRenderer({
  html,
  aspectRatio,
  className,
  style,
  zoom = 1,
  editable = false,
  onHtmlChange,
}: SlideRendererProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editingRef = useRef(false);
  const onHtmlChangeRef = useRef(onHtmlChange);
  useEffect(() => {
    onHtmlChangeRef.current = onHtmlChange;
  }, [onHtmlChange]);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const { width: slideW, height: slideH } = DIMENSIONS[aspectRatio];

  const srcDoc = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    return wrapSlideHtml(html, aspectRatio, { assetOrigin: origin });
  }, [html, aspectRatio]);

  const [isEditing, setIsEditing] = useState(false);
  const [prevSrcDoc, setPrevSrcDoc] = useState(srcDoc);
  const [appliedSrc, setAppliedSrc] = useState(srcDoc);

  if (prevSrcDoc !== srcDoc) {
    setPrevSrcDoc(srcDoc);
    if (!isEditing) {
      setAppliedSrc(srcDoc);
    }
  }

  const measure = useCallback(() => {
    const el = outerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDims((prev) => {
        if (prev && Math.abs(prev.w - rect.width) < 1 && Math.abs(prev.h - rect.height) < 1) {
          return prev;
        }
        return { w: rect.width, h: rect.height };
      });
    }
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => measure());
    obs.observe(el);
    measure();
    return () => obs.disconnect();
  }, [measure]);

  // Calculate scale to fit the slide into the container
  const scale = dims
    ? Math.min(dims.w / slideW, dims.h / slideH) * Math.max(0.25, zoom)
    : 0;

  const scaledW = Math.floor(slideW * scale);
  const scaledH = Math.floor(slideH * scale);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {scale > 0 && (
        <div
          style={{
            width: scaledW,
            height: scaledH,
            overflow: "hidden",
            borderRadius: 8,
            position: "relative",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            srcDoc={appliedSrc}
            title="Slide preview"
            onLoad={() => {
              const doc = iframeRef.current?.contentDocument;
              if (!doc || !editable) return;
              const styleEl = doc.createElement("style");
              styleEl.textContent =
                '[data-oc-field]{cursor:text;}[data-oc-field]:focus{outline:2px dashed #e94560;outline-offset:4px;}';
              doc.head.appendChild(styleEl);
              doc.querySelectorAll<HTMLElement>("[data-oc-field]").forEach((el) => {
                if (el.tagName === "IMG") return;
                if (el.getAttribute("data-oc-hidden") === "true") return;
                el.contentEditable = "true";
                el.spellcheck = false;
                el.addEventListener("focus", () => {
                  editingRef.current = true;
                  setIsEditing(true);
                });
                el.addEventListener("blur", () => {
                  editingRef.current = false;
                  setIsEditing(false);
                  setAppliedSrc(srcDoc);
                });
                el.addEventListener("input", () => {
                  editingRef.current = true;
                  setIsEditing(true);
                  onHtmlChangeRef.current?.(doc.body.innerHTML.trim());
                });
              });
            }}
            style={{
              width: slideW,
              height: slideH,
              border: "none",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: editable ? "auto" : "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
