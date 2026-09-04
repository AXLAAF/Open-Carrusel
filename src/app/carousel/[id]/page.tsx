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
import { ShortcutsHelp } from "@/components/editor/ShortcutsHelp";
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
    a.slides.length !== b.slides.length ||
    JSON.stringify(a.palette || null) !== JSON.stringify(b.palette || null) ||
    JSON.stringify(a.hookVariants || null) !== JSON.stringify(b.hookVariants || null) ||
    a.activeHookVariantId !== b.activeHookVariantId
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
  const [cursorAvailable, setCursorAvailable] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [studioOpen, setStudioOpen] = useState(true);
  const [studioTab, setStudioTab] = useState<StudioTab>("design");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
  const captionDirtyRef = useRef(false);
  const etagRef = useRef<string | null>(null);
  const draftById = useRef<Record<string, string>>({});
  const pollAbort = useRef<AbortController | null>(null);
  const persistHtmlRef = useRef<(slideId: string, html: string) => Promise<void>>(
    async () => {}
  );
  const handleCaptionDirty = useCallback((d: boolean) => {
    captionDirtyRef.current = d;
  }, []);

  const fetchCarousel = useCallback(async (opts?: { force?: boolean }) => {
    pollAbort.current?.abort();
    const ac = new AbortController();
    pollAbort.current = ac;
    try {
      const headers: HeadersInit = {};
      if (!opts?.force && etagRef.current) {
        headers["If-None-Match"] = etagRef.current;
      }
      const res = await fetch(`/api/carousels/${id}`, {
        headers,
        signal: ac.signal,
      });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.status === 304) return;
      if (!res.ok) return;
      const nextEtag = res.headers.get("ETag");
      const data: Carousel = await res.json();
      if (ac.signal.aborted) return;
      // Skip poll updates while the user has unsaved local edits — unless forced
      // (e.g. hook pick must win over a stale draft).
      if (dirtyRef.current && !opts?.force) return;
      if (nextEtag) etagRef.current = nextEtag;
      let jumpToLast = false;
      let skipActive = false;
      setCarousel((prev) => {
        if (prev && carouselUnchanged(prev, data)) {
          skipActive = true;
          return prev;
        }
        jumpToLast = !!(prev && data.slides.length > prev.slides.length);
        return data;
      });
      if (!skipActive) {
        setActiveSlide((prevIdx) =>
          data.slides.length === 0
            ? 0
            : jumpToLast
              ? data.slides.length - 1
              : Math.min(prevIdx, data.slides.length - 1)
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }, [id]);

  /** After hook generate/pick: drop stale draft so preview shows the server HTML. */
  const handleHookApplied = useCallback(
    async (info?: { slideId?: string }) => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (info?.slideId) {
        delete draftById.current[info.slideId];
        setDraft((d) => (d?.id === info.slideId ? null : d));
      }
      dirtyRef.current = Object.keys(draftById.current).length > 0;
      etagRef.current = null;
      await fetchCarousel({ force: true });
    },
    [fetchCarousel]
  );

  useEffect(() => {
    const load = async () => {
      await fetchCarousel();
      try {
        const [chat, brandRes] = await Promise.all([
          fetch("/api/chat/check").then((r) => r.json()),
          fetch("/api/brand").then((r) => r.json()),
        ]);
        if (chat.available === false) setCursorAvailable(false);
        setBrand(brandRes);
      } catch {
        setCursorAvailable(false);
      }
    };
    load();
  }, [fetchCarousel]);

  useEffect(() => {
    if (notFound) return;
    const tick = () => {
      if (document.hidden || dirtyRef.current || captionDirtyRef.current) return;
      void fetchCarousel();
    };
    const onVisibilityChange = () => {
      if (!document.hidden && !dirtyRef.current && !captionDirtyRef.current) {
        void fetchCarousel();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const ms = isGenerating ? 1000 : 3000;
    const interval = setInterval(tick, ms);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isGenerating, fetchCarousel, notFound]);

  const current = carousel?.slides[activeSlide] ?? null;
  const draftHtml =
    current && draft?.id === current.id ? draft.html : (current?.html ?? "");

  const persistHtml = useCallback(
    async (slideId: string, html: string) => {
      dirtyRef.current = true;
      try {
        const res = await fetch(`/api/carousels/${id}/slides/${slideId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html }),
        });
        if (!res.ok) return;
        if (draftById.current[slideId] === html) {
          delete draftById.current[slideId];
        }
        if (Object.keys(draftById.current).length === 0) {
          dirtyRef.current = false;
        }
        redoStack.current = [];
        if (!dirtyRef.current) await fetchCarousel();
      } catch {
        dirtyRef.current = true;
      }
    },
    [id, fetchCarousel]
  );
  useEffect(() => {
    persistHtmlRef.current = persistHtml;
  }, [persistHtml]);

  const handleHtmlChange = useCallback(
    (html: string) => {
      if (!current) return;
      const slideId = current.id;
      draftById.current[slideId] = html;
      setDraft({ id: slideId, html });
      dirtyRef.current = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void persistHtml(slideId, html);
      }, 450);
    },
    [current, persistHtml]
  );

  const prevSlideIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevSlideIdRef.current;
    const next = current?.id ?? null;
    if (prev === next) return;
    if (prev && draftById.current[prev] != null) {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      void persistHtml(prev, draftById.current[prev]);
    }
    prevSlideIdRef.current = next;
    if (next && draftById.current[next] != null) {
      setDraft({ id: next, html: draftById.current[next] });
    } else {
      setDraft(null);
    }
  }, [current?.id, persistHtml]);

  useEffect(() => {
    return () => {
      pollAbort.current?.abort();
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      const slideId = prevSlideIdRef.current;
      if (slideId && draftById.current[slideId] != null) {
        void persistHtmlRef.current(slideId, draftById.current[slideId]);
      }
    };
  }, []);

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
      redoStack.current.push(draftHtml || current.html);
    }
    const res = await fetch(`/api/carousels/${id}/slides/${slideId}/undo`, {
      method: "POST",
    });
    if (res.ok) await fetchCarousel();
  };

  const handleRedo = async () => {
    const html = redoStack.current.pop();
    if (!html || !current) return;
    await persistHtml(current.id, html);
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
      const res = await fetch(`/api/carousels/${id}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIds }),
      });
      if (res.ok) await fetchCarousel();
    },
    [id, fetchCarousel]
  );

  const handleAspectChange = async (ratio: AspectRatio) => {
    if (!carousel) return;
    dirtyRef.current = false;
    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aspectRatio: ratio }),
    });
    if (res.ok) {
      draftById.current = {};
      setDraft(null);
      await fetchCarousel();
    }
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
    onFullscreen: () => setShowFullscreen((v) => !v),
    onToggleChat: () => setChatOpen((v) => !v),
    onFocusChat: () => {
      setChatOpen(true);
      requestAnimationFrame(() => chatInputRef.current?.focus());
    },
    onToggleStudio: () => setStudioOpen((v) => !v),
    onStudioTab: (tab) => {
      setStudioOpen(true);
      setStudioTab(tab);
    },
    onHelp: () => setShowHelp((v) => !v),
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
        username={brand?.name || carousel.name}
        caption={carousel.caption}
        hashtags={carousel.hashtags}
      />

      <ShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />

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
          <div className="oc-fade w-96 border-r border-border shrink-0 flex flex-col bg-surface">
            <ChatPanel
              carouselId={id}
              cursorAvailable={cursorAvailable}
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
            editable
            onHtmlChange={handleHtmlChange}
          />

          <CaptionPanel
            carouselId={id}
            caption={carousel.caption}
            hashtags={carousel.hashtags}
            onSaved={fetchCarousel}
            onDirtyChange={handleCaptionDirty}
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
              onHookApplied={handleHookApplied}
              onBrandSaved={setBrand}
              onRestyle={handleRestyle}
              onRestore={(html) => {
                if (current) void persistHtml(current.id, html);
              }}
              onFullscreen={() => setShowFullscreen(true)}
              showSafeZones={showSafeZones}
              onToggleSafeZones={() => setShowSafeZones((v) => !v)}
              onJumpSlide={(slideId) => {
                const idx = carousel.slides.findIndex((s) => s.id === slideId);
                if (idx >= 0) setActiveSlide(idx);
              }}
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
