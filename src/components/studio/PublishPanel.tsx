"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Maximize2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Carousel, PublishStatus } from "@/types/carousel";
import {
  getPublishChecks,
  PUBLISH_STATUS_LABELS,
  isQueueReady,
  resolvePublishStatus,
} from "@/lib/publish-ready";

interface PublishPanelProps {
  carousel: Carousel;
  onFullscreen: () => void;
  onToggleSafeZones: () => void;
  showSafeZones: boolean;
  onSaved: () => void;
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PublishPanel({
  carousel,
  onFullscreen,
  onToggleSafeZones,
  showSafeZones,
  onSaved,
}: PublishPanelProps) {
  const [name, setName] = useState(carousel.name);
  const [caption, setCaption] = useState(carousel.caption || "");
  const [tags, setTags] = useState((carousel.hashtags || []).join(" "));
  const [scheduleLocal, setScheduleLocal] = useState(
    toLocalInput(carousel.scheduledAt)
  );
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setName(carousel.name);
    setCaption(carousel.caption || "");
    setTags((carousel.hashtags || []).join(" "));
    setScheduleLocal(toLocalInput(carousel.scheduledAt));
  }, [
    carousel.id,
    carousel.name,
    carousel.caption,
    carousel.hashtags,
    carousel.scheduledAt,
    carousel.updatedAt,
  ]);

  const hashtags = tags
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

  const dirty =
    name !== carousel.name ||
    caption !== (carousel.caption || "") ||
    hashtags.join(" ") !== (carousel.hashtags || []).join(" ");

  const draftCarousel = useMemo(
    () => ({
      ...carousel,
      caption,
      hashtags,
    }),
    [carousel, caption, hashtags]
  );

  const checks = useMemo(() => {
    const base = getPublishChecks(draftCarousel);
    return [
      ...base,
      {
        id: "safe",
        ok: showSafeZones,
        label: "Revisaste zonas seguras",
      },
    ];
  }, [draftCarousel, showSafeZones]);

  const status = resolvePublishStatus(draftCarousel);
  const ready = isQueueReady(draftCarousel);

  const pack = [caption.trim(), hashtags.map((h) => `#${h}`).join(" ")]
    .filter(Boolean)
    .join("\n\n");

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carousel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, caption, hashtags }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async (clear = false) => {
    setScheduling(true);
    setError(null);
    try {
      const body = clear
        ? { carouselId: carousel.id, clear: true }
        : {
            carouselId: carousel.id,
            scheduledAt: scheduleLocal
              ? new Date(scheduleLocal).toISOString()
              : null,
          };
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo programar");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al programar");
    } finally {
      setScheduling(false);
    }
  };

  const setStatus = async (publishStatus: PublishStatus) => {
    setScheduling(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: carousel.id, publishStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar estado");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de estado");
    } finally {
      setScheduling(false);
    }
  };

  const copyPack = async () => {
    await navigator.clipboard.writeText(pack);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-2">
        <span className="text-[10px] text-muted-foreground">Cola</span>
        <span
          className={`text-[10px] font-semibold ${
            ready ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          {PUBLISH_STATUS_LABELS[status]}
          {ready ? " · listo" : ""}
        </span>
      </div>

      <label className="block space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground">Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-8 rounded-md border border-border bg-muted px-2"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground">Caption</span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Línea gancho. Valor. CTA."
          className="w-full rounded-md border border-border bg-muted p-2 resize-none"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[10px] font-medium text-muted-foreground">Hashtags</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="nicho marca tema"
          className="w-full h-8 rounded-md border border-border bg-muted px-2"
        />
      </label>
      {error && <p className="text-destructive">{error}</p>}
      <Button size="sm" className="w-full" disabled={!dirty || saving} onClick={() => void save()}>
        <Save className="h-3 w-3" />
        {saving ? "Guardando…" : "Guardar publicación"}
      </Button>

      <section className="space-y-2 pt-1 border-t border-border">
        <p className="text-[10px] font-medium text-muted-foreground">
          Programar publicación
        </p>
        <input
          type="datetime-local"
          value={scheduleLocal}
          onChange={(e) => setScheduleLocal(e.target.value)}
          className="w-full h-8 rounded-md border border-border bg-muted px-2"
        />
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="flex-1"
            disabled={scheduling || !scheduleLocal}
            onClick={() => void saveSchedule(false)}
          >
            {scheduling ? "…" : "Encolar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={scheduling || !carousel.scheduledAt}
            onClick={() => void saveSchedule(true)}
          >
            Quitar
          </Button>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={scheduling || !ready || status === "ready"}
            onClick={() => void setStatus("ready")}
          >
            Marcar listo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={scheduling || status === "published"}
            onClick={() => void setStatus("published")}
          >
            Publicado
          </Button>
        </div>
      </section>

      <p className="text-[10px] font-medium text-muted-foreground pt-1">Checklist Instagram</p>
      <ul className="space-y-1.5">
        {checks.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            {item.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="outline" className="w-full" onClick={onToggleSafeZones}>
        {showSafeZones ? "Ocultar zonas seguras" : "Ver zonas seguras"}
      </Button>
      <Button size="sm" variant="outline" className="w-full" onClick={onFullscreen}>
        <Maximize2 className="h-3.5 w-3.5" />
        Ventana Instagram (F)
      </Button>
      <Button size="sm" className="w-full" disabled={!pack} onClick={() => void copyPack()}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar caption + hashtags"}
      </Button>
      <p className="text-muted-foreground leading-relaxed">
        Cola: inicio → pestaña Cola · CLI:{" "}
        <span className="font-mono">pnpm oc -- schedule list</span>
        <br />
        Export: <span className="font-mono">pnpm oc -- export {carousel.id}</span>
      </p>
    </div>
  );
}
