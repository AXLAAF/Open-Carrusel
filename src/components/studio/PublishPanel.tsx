"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Carousel } from "@/types/carousel";
import { readLayout } from "@/lib/slide-fields";

interface PublishPanelProps {
  carousel: Carousel;
  onFullscreen: () => void;
  onToggleSafeZones: () => void;
  showSafeZones: boolean;
}

export function PublishPanel({
  carousel,
  onFullscreen,
  onToggleSafeZones,
  showSafeZones,
}: PublishPanelProps) {
  const [copied, setCopied] = useState(false);
  const first = carousel.slides[0];
  const last = carousel.slides[carousel.slides.length - 1];
  const firstLayout = first ? readLayout(first.html) : null;
  const lastLayout = last ? readLayout(last.html) : null;

  const checks = useMemo(
    () => [
      {
        ok: carousel.slides.length >= 5 && carousel.slides.length <= 10,
        label: `${carousel.slides.length} diapositivas (ideal 5–10)`,
      },
      {
        ok: firstLayout === "hook" || /hook/i.test(first?.notes || ""),
        label: "La primera es un hook",
      },
      {
        ok: lastLayout === "cta" || /cta/i.test(last?.notes || ""),
        label: "La última es un CTA",
      },
      { ok: Boolean(carousel.caption?.trim()), label: "Caption escrito" },
      {
        ok: (carousel.hashtags?.length ?? 0) >= 3,
        label: `${carousel.hashtags?.length ?? 0} hashtags (mín. 3)`,
      },
      { ok: showSafeZones, label: "Revisaste zonas seguras" },
    ],
    [carousel, first?.notes, firstLayout, last?.notes, lastLayout, showSafeZones]
  );

  const pack = [
    carousel.caption?.trim() || "",
    (carousel.hashtags || []).map((h) => `#${h}`).join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  const copyPack = async () => {
    await navigator.clipboard.writeText(pack);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <p className="text-[10px] font-medium text-muted-foreground">Checklist Instagram</p>
      <ul className="space-y-1.5">
        {checks.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <span className={item.ok ? "text-green-600" : "text-muted-foreground"}>{item.ok ? "✓" : "○"}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="outline" className="w-full" onClick={onToggleSafeZones}>
        {showSafeZones ? "Ocultar zonas seguras" : "Ver zonas seguras"}
      </Button>
      <Button size="sm" variant="outline" className="w-full" onClick={onFullscreen}>
        <Maximize2 className="h-3.5 w-3.5" />
        Vista swipe
      </Button>
      <Button size="sm" className="w-full" disabled={!pack} onClick={copyPack}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar caption + hashtags"}
      </Button>
      <p className="text-muted-foreground leading-relaxed">
        El CLI también publica el paquete:{" "}
        <span className="font-mono">npm run oc -- export {carousel.id}</span>
      </p>
    </div>
  );
}
