"use client";

import {
  Trash2,
  Bookmark,
  Maximize2,
  Grid3X3,
  Code2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatioSelector } from "@/components/editor/AspectRatioSelector";
import { ExportButton } from "@/components/editor/ExportButton";
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
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  carouselId: string;
  slideCount: number;
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
  inspectorOpen,
  onToggleInspector,
  carouselId,
  slideCount,
}: EditorToolbarProps) {
  return (
    <div className="h-11 border-b border-border bg-surface flex items-center px-4 gap-2 shrink-0">
      <AspectRatioSelector value={aspectRatio} onChange={onAspectChange} />
      <div className="flex-1" />
      <Button
        variant={inspectorOpen ? "outline" : "ghost"}
        size="sm"
        onClick={onToggleInspector}
        className={inspectorOpen ? "border-accent text-accent" : "text-muted-foreground"}
        aria-label="Edit HTML"
        title="Editar HTML"
      >
        <Code2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onFullscreen}
        className="text-muted-foreground"
        aria-label="Fullscreen preview"
        title="Vista completa"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={showSafeZones ? "outline" : "ghost"}
        size="sm"
        onClick={onToggleSafeZones}
        className={showSafeZones ? "border-accent text-accent" : "text-muted-foreground"}
        aria-label="Toggle safe zones"
        title="Zonas seguras de Instagram"
      >
        <Grid3X3 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveTemplate}
        className="text-muted-foreground"
        aria-label="Save as template"
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
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5"
      >
        <MessageSquare className="h-3 w-3" />
        {chatOpen ? "Ocultar chat" : "Chat"}
      </button>
      <ExportButton carouselId={carouselId} slideCount={slideCount} />
    </div>
  );
}
