"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewIssue, ReviewResult } from "@/lib/slide-review";

interface ReviewPanelProps {
  carouselId: string;
  onJumpSlide?: (slideId: string) => void;
}

export function ReviewPanel({ carouselId, onJumpSlide }: ReviewPanelProps) {
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carouselId}/review`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en revisión");
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setReview(null);
    } finally {
      setLoading(false);
    }
  }, [carouselId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 p-3 text-xs text-muted-foreground">Revisando…</div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-3 space-y-2 text-xs">
        <p className="text-destructive">{error}</p>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!review) return null;

  const Icon = ({ issue }: { issue: ReviewIssue }) => {
    if (issue.ok) return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />;
    if (issue.severity === "warn")
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />;
    return <Circle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-2">
        <div>
          <p className="font-semibold">
            {review.ok ? "Listo para export" : "Hay correcciones"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Score {review.score}% · {review.passed}/{review.total} checks
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-7" onClick={() => void load()}>
          <RefreshCw className="h-3 w-3" />
          Otra vez
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Contraste ≥4.5 · padding ≥80px · hook ≤8 palabras · CTA al final
      </p>

      <ul className="space-y-2">
        {review.issues.map((issue) => (
          <li key={issue.id}>
            <button
              type="button"
              disabled={!issue.slideId || !onJumpSlide}
              onClick={() => issue.slideId && onJumpSlide?.(issue.slideId)}
              className="w-full text-left flex items-start gap-2 rounded-md hover:bg-muted/60 p-1 -m-1 disabled:hover:bg-transparent"
            >
              <Icon issue={issue} />
              <span>
                <span className="block">{issue.label}</span>
                {issue.detail && !issue.ok && (
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    {issue.detail}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground leading-relaxed pt-1">
        CLI: <span className="font-mono">pnpm oc -- review {carouselId}</span>
      </p>
    </div>
  );
}
