"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOOK_STYLE_LABELS } from "@/lib/hook-variants";
import type { Carousel, HookVariant } from "@/types/carousel";
import { cn } from "@/lib/utils";

interface HookVariantsPanelProps {
  carousel: Carousel;
  onApplied: (info?: { slideId?: string }) => void;
}

export function HookVariantsPanel({
  carousel,
  onApplied,
}: HookVariantsPanelProps) {
  const [variants, setVariants] = useState<HookVariant[]>(
    carousel.hookVariants || []
  );
  const [activeId, setActiveId] = useState<string | null>(
    carousel.activeHookVariantId || null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVariants(carousel.hookVariants || []);
    setActiveId(carousel.activeHookVariantId || null);
  }, [
    carousel.id,
    carousel.hookVariants,
    carousel.activeHookVariantId,
    carousel.updatedAt,
  ]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/hooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron generar");
      setVariants(data.variants || []);
      setActiveId(null);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const pick = async (variant: HookVariant, index: number) => {
    if (activeId === variant.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/hooks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variant.id, index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo aplicar");
      setActiveId(data.activeHookVariantId || variant.id);
      if (Array.isArray(data.variants)) setVariants(data.variants);
      onApplied({ slideId: data.slideId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carousel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hookVariants: null,
          activeHookVariantId: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudieron cerrar");
      }
      setVariants([]);
      setActiveId(null);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2 pt-1 pb-2 border-b border-border mb-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-muted-foreground">
          Variantes A/B del hook
        </p>
        <div className="flex gap-1">
          {variants.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px]"
              disabled={busy}
              onClick={() => void clear()}
            >
              Cerrar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            disabled={busy}
            onClick={() => void generate()}
          >
            {busy ? "…" : variants.length ? "Regenerar 3" : "Generar 3 hooks"}
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Tres opciones guardadas. Elige o cambia en cualquier momento; se aplican
        al primer hook.
      </p>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      {variants.length > 0 && (
        <ul className="space-y-1.5">
          {variants.map((v, i) => {
            const selected = activeId === v.id;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pick(v, i)}
                  className={cn(
                    "w-full text-left rounded-md border px-2.5 py-2 transition-colors",
                    "disabled:opacity-50",
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-accent font-medium">
                      {String.fromCharCode(65 + i)} ·{" "}
                      {HOOK_STYLE_LABELS[v.style]}
                    </span>
                    {selected && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-accent font-medium">
                        <Check className="h-3 w-3" />
                        Activo
                      </span>
                    )}
                  </span>
                  <span className="block text-xs font-semibold mt-0.5 leading-snug">
                    {v.title}
                  </span>
                  {v.body && (
                    <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">
                      {v.body}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
