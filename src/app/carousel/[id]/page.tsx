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
import { SlideInspector } from "@/components/editor/SlideInspector";
import type { Carousel, AspectRatio } from "@/types/carousel";

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
  const [chatOpen, setChatOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

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
        const res = await fetch("/api/chat/check");
        const data: { available?: boolean } = await res.json();
        if (data.available === false) setClaudeAvailable(false);
      } catch {
        // assume available
      }
    };
    load();
  }, [fetchCarousel]);

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      fetchCarousel();
    };
    const ms = isGenerating ? 500 : 2000;
    const interval = setInterval(tick, ms);
    return () => clearInterval(interval);
  }, [isGenerating, fetchCarousel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (!carousel) return;
      if (e.key === "ArrowLeft") {
        setActiveSlide((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setActiveSlide((i) => Math.min(carousel.slides.length - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [carousel]);

  const handleAspectChange = async (ratio: AspectRatio) => {
    if (!carousel) return;
    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aspectRatio: ratio }),
    });
    if (res.ok) setCarousel(await res.json());
  };

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
    const res = await fetch(`/api/carousels/${id}/slides/${slideId}/undo`, {
      method: "POST",
    });
    if (res.ok) await fetchCarousel();
  };

  const handleAddSlide = async () => {
    const res = await fetch(`/api/carousels/${id}/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blank: true, notes: "blank" }),
    });
    if (res.ok) {
      await fetchCarousel();
      setInspectorOpen(true);
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

  const current = carousel.slides[activeSlide] ?? null;

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
        slides={carousel.slides}
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
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen((v) => !v)}
            carouselId={carousel.id}
            slideCount={carousel.slides.length}
          />

          <CarouselPreview
            slides={carousel.slides}
            aspectRatio={carousel.aspectRatio}
            activeIndex={activeSlide}
            onActiveChange={setActiveSlide}
            showSafeZones={showSafeZones}
          />

          <CaptionPanel
            carouselId={id}
            caption={carousel.caption}
            hashtags={carousel.hashtags}
            onSaved={fetchCarousel}
          />
        </div>

        {inspectorOpen && (
          <div className="oc-fade w-[380px] border-l border-border shrink-0 flex flex-col bg-surface min-h-0">
            <SlideInspector
              carouselId={id}
              slide={current}
              slideIndex={activeSlide}
              onSaved={fetchCarousel}
            />
          </div>
        )}
      </div>

      <SlideFilmstrip
        slides={carousel.slides}
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
