"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PUBLISH_STATUS_LABELS } from "@/lib/publish-ready";
import type { PublishStatus } from "@/types/carousel";

interface QueueItem {
  id: string;
  name: string;
  aspectRatio: string;
  slides: number;
  scheduledAt: string | null;
  lastExportAt: string | null;
  publishStatus: PublishStatus;
  ready: boolean;
  checks: { id: string; ok: boolean; label: string }[];
}

interface SectionProps {
  title: string;
  items: QueueItem[];
  onSelect: (id: string) => void;
}

function Section({ title, items, onSelect }: SectionProps) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2 mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="w-full text-left rounded-xl border border-border bg-surface hover:border-accent/40 p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.slides} slides · {item.aspectRatio}
                    {item.scheduledAt
                      ? ` · ${new Date(item.scheduledAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <Badge variant={item.ready ? "default" : "secondary"}>
                  {PUBLISH_STATUS_LABELS[item.publishStatus]}
                </Badge>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {item.checks.map((c) => (
                  <li
                    key={c.id}
                    className="text-[10px] text-muted-foreground inline-flex items-center gap-1"
                  >
                    {c.ok ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {c.label}
                  </li>
                ))}
              </ul>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PublishQueue() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => {
        setQueue(data.queue || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const scheduled = queue
      .filter((q) => q.scheduledAt)
      .sort(
        (a, b) =>
          Date.parse(a.scheduledAt!) - Date.parse(b.scheduledAt!)
      );
    const ready = queue.filter((q) => !q.scheduledAt && q.ready);
    const draft = queue.filter((q) => !q.scheduledAt && !q.ready);
    return { scheduled, ready, draft };
  }, [queue]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Sin carruseles en cola</p>
        <p className="text-xs text-muted-foreground mt-1">
          Completa caption + export y programa una fecha en Publicar
        </p>
      </div>
    );
  }

  return (
    <div>
      <Section title="Programados" items={grouped.scheduled} onSelect={(id) => router.push(`/carousel/${id}`)} />
      <Section title="Listos para publicar" items={grouped.ready} onSelect={(id) => router.push(`/carousel/${id}`)} />
      <Section title="Borradores" items={grouped.draft} onSelect={(id) => router.push(`/carousel/${id}`)} />
    </div>
  );
}
