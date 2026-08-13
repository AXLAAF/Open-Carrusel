"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CarouselPreview } from "@/components/editor/CarouselPreview";
import { SlideFilmstrip } from "@/components/editor/SlideFilmstrip";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { FullscreenPreview } from "@/components/editor/FullscreenPreview";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { StudioPanel, type StudioTab } from "@/components/studio/StudioPanel";
import { useEditorShortcuts } from "@/components/editor/useEditorShortcuts";
import type { Carousel, AspectRatio } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";
import type { LayoutId } from "@/types/layout";

interface PageProps {
  params: Promise<{ id: string }>;
}

function carouselUnchanged(a: Carousel, b: Carousel): boolean {
  if (
    a.updatedAt !== b.updatedAt ||
    a.name !== b.name ||
    a.aspectRatio !== b.aspectRatio ||
    a.caption !== b.caption ||
    a.slides.length !== b.slides.length
  ) {
    return false;
  }
  return a.slides.every(
    (s, i) =>
      s.id === b.slides[i].id &&
      s.html === b.slides[i].html &&
      s.notes === b.slides[i].notes
  );
}

export default function CarouselEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [claudeAvailable, setClaudeAvailable] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(true);
  const [studioTab, setStudioTab] = useState<StudioTab>("design");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [draft, setDraft] = useState<{ id: string; html: string } | null>(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimer = useRef<number | null>(null);
  const redoStack = useRef<string[]>([]);
  const dirtyRef = useRef(false);

  const fetchCarousel = useCallback(async () => {
    try {
      const res = await fetch(`/api/carousels/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data: Carousel = await res.json();
        setCarousel((prev) => {
          if (prev && carouselUnchanged(prev, data)) return prev;
          if (prev && data.slides.length > prev.slides.length) {
            setActiveSlide(data.slides.length - 1);
          } else {
            setActiveSlide((prevIdx) =>
              data.slides.length === 0
                ? 0
                : Math.min(prevIdx, data.slides.length - 1)
            );
          }
          return data;
        });
      }
    } catch {
      // ignore network errors
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      await fetchCarousel();
      try {
        const [chat, brandRes] = await Promise.all([
          fetch("/api/chat/check").then((r) => r.json()),
          fetch("/api/brand").then((r) => r.json()),
        ]);
        if (chat.available === false) setClaudeAvailable(false);
        setBrand(brandRes);
      } catch {
        setClaudeAvailable(false);
      }
    };
    load();
  }, [fetchCarousel]);

  useEffect(() => {
    const tick = () => {
      if (document.hidden || dirtyRef.current) return;
      fetchCarousel();
    };
    const ms = isGenerating ? 500 : 2000;
    const interval = setInterval(tick, ms);
    return () => clearInterval(interval);
  }, [isGenerating, fetchCarousel]);

  const current = carousel?.slides[activeSlide] ?? null;
  const draftHtml =
    current && draft?.id === current.id ? draft.html : (current?.html ?? "");

  const persistHtml = useCallback(
    async (html: string) => {
      if (!current) return;
      dirtyRef.current = true;
      await fetch(`/api/carousels/${id}/slides/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      dirtyRef.current = false;
      redoStack.current = [];
      await fetchCarousel();
    },
    [current, id, fetchCarousel]
  );

  const handleHtmlChange = useCallback(
    (html: string) => {
      if (!current) return;
      setDraft({ id: current.id, html });
      dirtyRef.current = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void persistHtml(html);
      }, 450);
    },
    [current, persistHtml]
  );

  const handleDeleteSlide = (slideId: string) => {
    if (!carousel) return;
    const slideIndex = carousel.slides.findIndex((s) => s.id === slideId);
    setConfirmState({
      open: true,
      title: `¿Borrar diapositiva ${slideIndex + 1}?`,
      description: "Esta acción no se puede deshacer.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}/slides/${slideId}`, {
          method: "DELETE",
        });
        if (res.ok) await fetchCarousel();
      },
    });
  };

  const handleUndoSlide = async (slideId: string) => {
    if (current && current.id === slideId) {
      redoStack.current.push(current.html);
    }
    const res = await fetch(`/api/carousels/${id}/slides/${slideId}/undo`, {
      method: "POST",
    });
    if (res.ok) await fetchCarousel();
  };

  const handleRedo = async () => {
    const html = redoStack.current.pop();
    if (!html || !current) return;
    await persistHtml(html);
  };

  const handleAddSlide = async (layout: LayoutId = "value") => {
    const res = await fetch(`/api/carousels/${id}/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout, notes: layout }),
    });
    if (res.ok) {
      await fetchCarousel();
      setStudioOpen(true);
      setStudioTab("design");
    }
  };

  const handleDuplicateSlide = async (slideId: string) => {
    await fetch(`/api/carousels/${id}/slides/${slideId}/duplicate`, {
      method: "POST",
    });
    await fetchCarousel();
  };

  const handleDeleteCarousel = useCallback(() => {
    if (!carousel) return;
    setConfirmState({
      open: true,
      title: `¿Borrar "${carousel.name}"?`,
      description: "Se eliminará el carrusel y todas sus diapositivas.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}`, { method: "DELETE" });
        if (res.ok) router.push("/");
      },
    });
  }, [carousel, id, router]);

  const handleReorderSlides = useCallback(
    async (slideIds: string[]) => {
      await fetch(`/api/carousels/${id}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIds }),
      });
      await fetchCarousel();
    },
    [id, fetchCarousel]
  );

  const handleAspectChange = async (ratio: AspectRatio) => {
    if (!carousel) return;
    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aspectRatio: ratio }),
    });
    if (res.ok) setCarousel(await res.json());
  };

  const handleRestyle = async () => {
    if (!current) return;
    const res = await fetch(`/api/carousels/${id}/slides/${current.id}/restyle`, {
      method: "POST",
    });
    if (res.ok) await fetchCarousel();
  };

  useEditorShortcuts({
    carousel,
    current,
    onPrev: () => setActiveSlide((i) => Math.max(0, i - 1)),
    onNext: () =>
      setActiveSlide((i) => Math.min((carousel?.slides.length ?? 1) - 1, i + 1)),
    onDelete: handleDeleteSlide,
    onDuplicate: (slideId) => {
      void handleDuplicateSlide(slideId);
    },
    onUndo: (slideId) => {
      void handleUndoSlide(slideId);
    },
    onRedo: () => {
      void handleRedo();
    },
    onFit: () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    },
    onActual: () => {
      setZoom(2);
      setPan({ x: 0, y: 0 });
    },
    onZoomIn: () => setZoom((z) => Math.min(4, Math.round((z + 0.1) * 10) / 10)),
    onZoomOut: () => setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10)),
  });

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Carrusel no encontrado</p>
        <Link href="/" className="text-sm text-accent underline">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  if (!carousel) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const liveSlide = current ? { ...current, html: draftHtml || current.html } : null;
  const previewSlides = liveSlide
    ? carousel.slides.map((s, i) => (i === activeSlide ? liveSlide : s))
    : carousel.slides;

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title={carousel.name}
        showBack
        editable
        onTitleChange={async (name) => {
          const res = await fetch(`/api/carousels/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (res.ok) setCarousel(await res.json());
        }}
      />

      <FullscreenPreview
        open={showFullscreen}
        onOpenChange={setShowFullscreen}
        slides={previewSlides}
        aspectRatio={carousel.aspectRatio}
        activeIndex={activeSlide}
        onActiveChange={setActiveSlide}
      />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Borrar"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {chatOpen && (
          <div className="oc-fade w-80 border-r border-border shrink-0 flex flex-col bg-surface">
            <ChatPanel
              carouselId={id}
              claudeAvailable={claudeAvailable}
              referenceImages={carousel.referenceImages || []}
              onStreamStart={() => setIsGenerating(true)}
              onStreamEnd={() => {
                setIsGenerating(false);
                fetchCarousel();
              }}
              chatInputRef={chatInputRef}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <EditorToolbar
            aspectRatio={carousel.aspectRatio}
            onAspectChange={handleAspectChange}
            onFullscreen={() => setShowFullscreen(true)}
            showSafeZones={showSafeZones}
            onToggleSafeZones={() => setShowSafeZones((v) => !v)}
            onSaveTemplate={async () => {
              await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ carouselId: carousel.id }),
              });
            }}
            onDeleteCarousel={handleDeleteCarousel}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((v) => !v)}
            studioOpen={studioOpen}
            onToggleStudio={() => setStudioOpen((v) => !v)}
            carouselId={carousel.id}
            slideCount={carousel.slides.length}
            activeSlideId={current?.id}
            zoom={zoom}
            onZoomChange={setZoom}
            onFit={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          />

          <CarouselPreview
            slides={previewSlides}
            aspectRatio={carousel.aspectRatio}
            activeIndex={activeSlide}
            onActiveChange={setActiveSlide}
            showSafeZones={showSafeZones}
            zoom={zoom}
            onZoomChange={setZoom}
            pan={pan}
            onPanChange={setPan}
          />

          <CaptionPanel
            carouselId={id}
            caption={carousel.caption}
            hashtags={carousel.hashtags}
            onSaved={fetchCarousel}
          />
        </div>

        {studioOpen && (
          <div className="oc-fade w-[400px] border-l border-border shrink-0 flex flex-col bg-surface min-h-0">
            <StudioPanel
              tab={studioTab}
              onTabChange={setStudioTab}
              carousel={carousel}
              slide={liveSlide}
              slideIndex={activeSlide}
              html={draftHtml || current?.html || ""}
              brand={brand}
              onHtmlChange={handleHtmlChange}
              onSaved={fetchCarousel}
              onBrandSaved={setBrand}
              onRestyle={handleRestyle}
              onRestore={(html) => {
                void persistHtml(html);
              }}
              onFullscreen={() => setShowFullscreen(true)}
              showSafeZones={showSafeZones}
              onToggleSafeZones={() => setShowSafeZones((v) => !v)}
            />
          </div>
        )}
      </div>

      <SlideFilmstrip
        slides={previewSlides}
        aspectRatio={carousel.aspectRatio}
        activeIndex={activeSlide}
        onActiveChange={setActiveSlide}
        onDeleteSlide={handleDeleteSlide}
        onUndoSlide={handleUndoSlide}
        onAddSlide={handleAddSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onReorderSlides={handleReorderSlides}
        isGenerating={isGenerating}
      />
    </div>
  );
}
