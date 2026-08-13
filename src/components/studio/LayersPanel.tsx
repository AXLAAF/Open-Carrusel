"use client";

import { Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listLayers, moveLayer, setLayerHidden } from "@/lib/slide-fields";

interface LayersPanelProps {
  html: string;
  onChange: (html: string) => void;
}

export function LayersPanel({ html, onChange }: LayersPanelProps) {
  const layers = listLayers(html);

  if (layers.length === 0) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        No hay capas. Usa un layout del CLI o la pestaña Diseño para generar campos{" "}
        <span className="font-mono">data-oc-layer</span>.
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-1">
      {layers.map((layer, index) => (
        <div
          key={layer.name}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5"
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onChange(setLayerHidden(html, layer.name, !layer.hidden))}
            aria-label={layer.hidden ? "Mostrar" : "Ocultar"}
          >
            {layer.hidden ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
          <span
            className={`flex-1 text-xs truncate ${layer.hidden ? "text-muted-foreground line-through" : ""}`}
          >
            {layer.name}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            disabled={index === 0}
            onClick={() => onChange(moveLayer(html, layer.name, -1))}
            aria-label="Subir"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            disabled={index === layers.length - 1}
            onClick={() => onChange(moveLayer(html, layer.name, 1))}
            aria-label="Bajar"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
