"use client";

import {
  Trash2,
  Bookmark,
  Maximize2,
  Grid3X3,
  PanelRight,
  MessageSquare,
  Minus,
  Plus,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatioSelector } from "@/components/editor/AspectRatioSelector";
import { ExportDialog } from "@/components/editor/ExportDialog";
import type { AspectRatio } from "@/types/carousel";

interface EditorToolbarProps {
  aspectRatio: AspectRatio;
  onAspectChange: (ratio: AspectRatio) => void;
  onFullscreen: () => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  onSaveTemplate: () => void;
  onDeleteCarousel: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  studioOpen: boolean;
  onToggleStudio: () => void;
  carouselId: string;
  slideCount: number;
  activeSlideId?: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
}

export function EditorToolbar({
  aspectRatio,
  onAspectChange,
  onFullscreen,
  showSafeZones,
  onToggleSafeZones,
  onSaveTemplate,
  onDeleteCarousel,
  chatOpen,
  onToggleChat,
  studioOpen,
  onToggleStudio,
  carouselId,
  slideCount,
  activeSlideId,
  zoom,
  onZoomChange,
  onFit,
}: EditorToolbarProps) {
  return (
    <div className="h-11 border-b border-border bg-surface flex items-center px-4 gap-2 shrink-0">
      <AspectRatioSelector value={aspectRatio} onChange={onAspectChange} />
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground"
          onClick={() => onZoomChange(Math.max(0.25, Math.round((zoom - 0.1) * 10) / 10))}
          title="Alejar"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={onFit}
          className="text-[11px] tabular-nums w-12 text-muted-foreground hover:text-foreground"
          title="Ajustar (⌘0)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground"
          onClick={() => onZoomChange(Math.min(4, Math.round((zoom + 0.1) * 10) / 10))}
          title="Acercar"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground"
          onClick={onFit}
          title="Ajustar a la vista"
        >
          <Scan className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1" />
      <Button
        variant={studioOpen ? "outline" : "ghost"}
        size="sm"
        onClick={onToggleStudio}
        className={studioOpen ? "border-accent text-accent" : "text-muted-foreground"}
        title="Editor (texto, capas, marca)"
      >
        <PanelRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onFullscreen}
        className="text-muted-foreground"
        title="Ventana Instagram (F)"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={showSafeZones ? "outline" : "ghost"}
        size="sm"
        onClick={onToggleSafeZones}
        className={showSafeZones ? "border-accent text-accent" : "text-muted-foreground"}
        title="Zonas seguras de Instagram"
      >
        <Grid3X3 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveTemplate}
        className="text-muted-foreground"
        title="Guardar como plantilla"
      >
        <Bookmark className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDeleteCarousel}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Delete carousel"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <button
        onClick={onToggleChat}
        title="Agente Cursor ( /  para escribir, [ para ocultar)"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5"
      >
        <MessageSquare className="h-3 w-3" />
        {chatOpen ? "Ocultar agente" : "Agente"}
      </button>
      <ExportDialog
        carouselId={carouselId}
        slideCount={slideCount}
        activeSlideId={activeSlideId}
      />
    </div>
  );
}
