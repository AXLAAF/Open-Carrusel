"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Layers,
  Calendar,
  SlidersHorizontal,
  Trash2,
  Copy,
  Library,
  FileUp,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateCarouselDialog } from "@/components/ui/create-carousel-dialog";
import { BrandSetup } from "@/components/brand/BrandSetup";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { PublishQueue } from "@/components/schedule/PublishQueue";
import { LayoutLibraryGallery } from "@/components/library/LayoutLibraryGallery";
import { ImportBriefDialog } from "@/components/studio/ImportBriefDialog";
import type { Carousel } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";

type HomeTab = "carousels" | "queue" | "library" | "templates";

export default function DashboardPage() {
  const router = useRouter();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrandSetup, setShowBrandSetup] = useState(false);
  const [brand, setBrand] = useState<BrandConfig | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/carousels").then((r) => r.json()),
      fetch("/api/brand").then((r) => r.json()),
    ])
      .then(([carouselData, brandData]) => {
        setCarousels(carouselData.carousels || []);
        setBrand(brandData);
        if (!brandData.name || brandData.name.trim() === "") {
          setShowBrandSetup(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      setConfirmState({
        open: true,
        title: `Delete "${name}"?`,
        description:
          "This will permanently delete the carousel and all its slides.",
        onConfirm: async () => {
          const res = await fetch(`/api/carousels/${id}`, { method: "DELETE" });
          if (res.ok) {
            setCarousels((prev) => prev.filter((c) => c.id !== id));
          }
        },
      });
    },
    []
  );

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("carousels");

  const handleCreate = useCallback(
    async (name: string, aspectRatio: string) => {
      const res = await fetch("/api/carousels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          aspectRatio,
        }),
      });
      if (res.ok) {
        const carousel = await res.json();
        router.push(`/carousel/${carousel.id}`);
      }
    },
    [router]
  );

  const tabs: { id: HomeTab; label: string }[] = [
    { id: "carousels", label: "Carruseles" },
    { id: "queue", label: "Cola" },
    { id: "library", label: "Biblioteca" },
    { id: "templates", label: "Plantillas" },
  ];

  return (
    <div className="h-full flex flex-col">
      <TopBar onSettingsClick={() => setShowBrandSetup(true)} />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />

      <CreateCarouselDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreate}
      />

      <ImportBriefDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />

      <BrandSetup
        open={showBrandSetup}
        onComplete={() => {
          setShowBrandSetup(false);
          fetch("/api/brand")
            .then((r) => r.json())
            .then((data) => setBrand(data))
            .catch(() => {});
        }}
        initialBrand={brand || undefined}
      />

      <main className="flex-1 overflow-y-auto relative">
        {/* Glow térmico de fondo sutil inspirado en Stitch */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-12 left-1/3 w-80 h-80 bg-[#d82b6b]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold">
                  Swiss Precision · 4:5 Native
                </span>
              </div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-white">
                SwipeForge
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Taller editorial de carruseles de alto impacto · cola de publicación · biblioteca modular
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="border-white/10 hover:border-white/25 hover:bg-white/5 text-sm"
              >
                <FileUp className="h-4 w-4 mr-1.5 text-accent" />
                Importar
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="accent"
                className="bg-gradient-to-r from-accent to-[#d82b6b] text-white font-medium shadow-[0_0_20px_rgba(255,85,0,0.25)] hover:shadow-[0_0_25px_rgba(216,43,107,0.4)] transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nuevo carrusel
              </Button>
            </div>
          </div>

          <div className="flex gap-1.5 mb-6 border-b border-border/60 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? "border-accent text-white font-semibold"
                    : "border-transparent text-muted-foreground hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "queue" ? (
            <PublishQueue />
          ) : activeTab === "library" ? (
            <LayoutLibraryGallery />
          ) : activeTab === "templates" ? (
            <TemplateGallery />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : carousels.length === 0 ? (
            <div className="text-center py-20">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Sin carruseles aún</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Crea tu primer carrusel o aplica un layout SwipeForge desde
                Biblioteca.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="accent"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Crear carrusel
                </Button>
                <Button
                  onClick={() => setActiveTab("library")}
                  variant="outline"
                  size="lg"
                >
                  <Library className="h-5 w-5" />
                  Ver biblioteca
                </Button>
              </div>
            </div>
          ) : (
            <div className="oc-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {carousels.map((carousel) => (
                <div
                  key={carousel.id}
                  onClick={() => router.push(`/carousel/${carousel.id}`)}
                  className="relative text-left rounded-xl border border-white/10 bg-[#12141c] hover:border-accent/40 hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 p-4 group cursor-pointer transition-all duration-200"
                >
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const res = await fetch(
                          `/api/carousels/${carousel.id}/duplicate`,
                          { method: "POST" }
                        );
                        if (res.ok) {
                          const dup = await res.json();
                          setCarousels((prev) => [dup, ...prev]);
                        }
                      }}
                      className="h-7 w-7 rounded-md flex items-center justify-center bg-[#1c1f2b] border border-white/15 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label={`Duplicate ${carousel.name}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) =>
                        handleDelete(e, carousel.id, carousel.name)
                      }
                      className="h-7 w-7 rounded-md flex items-center justify-center bg-[#1c1f2b] border border-white/15 text-white/80 hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                      aria-label={`Delete ${carousel.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="h-28 rounded-lg bg-muted mb-3 flex items-center justify-center overflow-hidden">
                    {carousel.slides.length > 0 ? (
                      <SlideRenderer
                        html={carousel.slides[0].html}
                        aspectRatio={carousel.aspectRatio}
                        className="w-full h-full"
                      />
                    ) : (
                      <Layers className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
                    {carousel.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      <SlidersHorizontal className="h-2.5 w-2.5 mr-1" />
                      {carousel.aspectRatio}
                    </Badge>
                    {carousel.publishStatus &&
                      carousel.publishStatus !== "draft" && (
                        <Badge variant="outline" className="text-[10px]">
                          {carousel.publishStatus}
                        </Badge>
                      )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {carousel.scheduledAt
                        ? new Date(carousel.scheduledAt).toLocaleDateString()
                        : new Date(carousel.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
