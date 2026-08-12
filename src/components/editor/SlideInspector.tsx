"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Slide } from "@/types/carousel";

interface SlideInspectorProps {
  carouselId: string;
  slide: Slide | null;
  slideIndex: number;
  onSaved: () => void;
}

export function SlideInspector({
  carouselId,
  slide,
  slideIndex,
  onSaved,
}: SlideInspectorProps) {
  const [html, setHtml] = useState(slide?.html ?? "");
  const [notes, setNotes] = useState(slide?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    touched.current = false;
    setHtml(slide?.html ?? "");
    setNotes(slide?.notes ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset draft only when switching slides
  }, [slide?.id]);

  useEffect(() => {
    if (!slide || touched.current) return;
    setHtml(slide.html);
    setNotes(slide.notes ?? "");
  }, [slide, slide?.html, slide?.notes]);

  const dirty =
    !!slide && (html !== slide.html || notes !== (slide.notes ?? ""));

  const handleSave = async () => {
    if (!slide || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/carousels/${carouselId}/slides/${slide.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, notes }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "No se pudo guardar"
        );
      }
      touched.current = false;
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!slide) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <Code2 className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No hay diapositiva seleccionada</p>
        <p className="text-xs mt-1">Añade una con el botón + de la tira</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">
            HTML · slide {slideIndex + 1}
          </p>
          <p className="text-[10px] text-muted-foreground truncate font-mono">
            data/slides/{carouselId}/{slide.id}.html
          </p>
        </div>
        {dirty && (
          <span className="text-[10px] text-accent font-medium">sin guardar</span>
        )}
      </div>

      <label className="px-3 pt-2 text-[10px] font-medium text-muted-foreground">
        Notas
      </label>
      <input
        value={notes}
        onChange={(e) => {
          touched.current = true;
          setNotes(e.target.value);
        }}
        placeholder="hook, valor, CTA…"
        className="mx-3 mt-1 mb-2 h-8 rounded-md border border-border bg-muted px-2 text-xs"
      />

      <textarea
        value={html}
        onChange={(e) => {
          touched.current = true;
          setHtml(e.target.value);
        }}
        spellCheck={false}
        className="flex-1 min-h-0 mx-3 mb-2 rounded-md border border-border bg-[#0f0f12] text-[#e8e8ed] font-mono text-[11px] leading-relaxed p-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Slide HTML"
      />

      {error && (
        <p className="px-3 pb-1 text-[11px] text-destructive">{error}</p>
      )}

      <div className="px-3 pb-3 flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={!dirty || saving}
          onClick={() => {
            touched.current = false;
            setHtml(slide.html);
            setNotes(slide.notes ?? "");
          }}
        >
          <RotateCcw className="h-3 w-3" />
          Revertir
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
          {saving ? "Guardando…" : "Aplicar"}
        </Button>
      </div>
    </div>
  );
}
