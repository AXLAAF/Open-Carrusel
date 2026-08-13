"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BrandConfig } from "@/types/brand";
import type { AspectRatio } from "@/types/carousel";
import type { LayoutId } from "@/types/layout";
import { LAYOUT_IDS, LAYOUT_LABELS } from "@/types/layout";
import {
  ensureEditable,
  extractFields,
  getRootStyle,
  setFieldStyle,
  setFieldText,
  setRootStyle,
  restyleHtml,
  type OcField,
} from "@/lib/slide-fields";
import { Button } from "@/components/ui/button";

interface DesignPanelProps {
  html: string;
  brand: BrandConfig | null;
  aspectRatio: AspectRatio;
  onChange: (html: string) => void;
}

export function DesignPanel({ html, brand, aspectRatio, onChange }: DesignPanelProps) {
  const editable = useMemo(() => ensureEditable(html), [html]);
  const fields = useMemo(() => extractFields(editable), [editable]);
  const root = useMemo(() => getRootStyle(editable), [editable]);
  const htmlRef = useRef(editable);

  useEffect(() => {
    htmlRef.current = editable;
  }, [editable]);

  const layoutFromHtml = useMemo(() => {
    const match = html.match(/data-oc-layout="([^"]+)"/);
    if (match && LAYOUT_IDS.includes(match[1] as LayoutId)) return match[1] as LayoutId;
    return "value" as LayoutId;
  }, [html]);

  const padding = parseInt(String(root.padding || "80").replace(/px.*/, ""), 10) || 80;
  const bg = (root.background || "#ffffff").split(" ")[0];
  const color = root.color || "#1a1a2e";

  const commit = (next: string) => {
    htmlRef.current = next;
    onChange(next);
  };

  const handleLayout = (next: LayoutId) => {
    if (!brand) return;
    commit(restyleHtml(editable, brand, aspectRatio, next));
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
      <section>
        <p className="text-[10px] font-medium text-muted-foreground mb-1">Layout</p>
        <select
          value={layoutFromHtml}
          onChange={(e) => handleLayout(e.target.value as LayoutId)}
          className="w-full h-8 rounded-md border border-border bg-muted px-2"
        >
          {LAYOUT_IDS.map((id) => (
            <option key={id} value={id}>
              {LAYOUT_LABELS[id]}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground">Lienzo</p>
        <label className="flex items-center justify-between gap-2">
          Padding
          <input
            type="number"
            min={40}
            max={160}
            value={padding}
            onChange={(e) =>
            commit(setRootStyle(htmlRef.current, { padding: `${Number(e.target.value) || 80}px` }))
            }
            className="h-7 w-20 rounded-md border border-border bg-muted px-2"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          Fondo
          <input
            type="color"
            value={/^#/.test(bg) ? bg : "#1b2b6b"}
            onChange={(e) => commit(setRootStyle(htmlRef.current, { background: e.target.value }))}
            className="h-7 w-12 cursor-pointer bg-transparent"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          Texto
          <input
            type="color"
            value={/^#/.test(color) ? color : "#ffffff"}
            onChange={(e) => commit(setRootStyle(htmlRef.current, { color: e.target.value }))}
            className="h-7 w-12 cursor-pointer bg-transparent"
          />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-[10px] font-medium text-muted-foreground">Texto y tipografía</p>
        {fields.length === 0 && (
          <p className="text-muted-foreground">
            Esta diapositiva no tiene campos editables. Cambia el layout o edita el HTML.
          </p>
        )}
        {fields.map((field) => (
          <FieldEditor
            key={field.name}
            field={field}
            getHtml={() => htmlRef.current}
            onChange={commit}
          />
        ))}
      </section>
    </div>
  );
}

function FieldEditor({
  field,
  getHtml,
  onChange,
}: {
  field: OcField;
  getHtml: () => string;
  onChange: (html: string) => void;
}) {
  const size = parseInt(String(field.style["font-size"] || "28").replace(/px/, ""), 10) || 28;
  const weight = field.style["font-weight"] || "400";
  const color = field.style.color || "";
  const align = field.style["text-align"] || "left";
  const timer = useRef<number | null>(null);
  const [text, setText] = useState(field.text);

  const patch = (next: string) => onChange(next);

  const pushText = (value: string) => {
    setText(value);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      patch(setFieldText(getHtml(), field.name, value));
    }, 250);
  };

  return (
    <div className="rounded-md border border-border p-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{field.name}</p>
      <textarea
        value={text}
        onChange={(e) => pushText(e.target.value)}
        rows={field.name === "body" || field.name === "quote" ? 3 : 2}
        className="w-full rounded-md border border-border bg-muted px-2 py-1 resize-none"
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="number"
          min={14}
          max={160}
          value={size}
          onChange={(e) =>
            patch(setFieldStyle(getHtml(), field.name, { "font-size": `${Number(e.target.value) || 28}px` }))
          }
          className="h-7 w-14 rounded-md border border-border bg-muted px-1"
          aria-label="Tamaño"
        />
        <Button
          type="button"
          size="sm"
          variant={weight === "800" || weight === "700" ? "outline" : "ghost"}
          className="h-7 px-2"
          onClick={() =>
            patch(
              setFieldStyle(getHtml(), field.name, {
                "font-weight": weight === "800" || weight === "700" ? "400" : "800",
              })
            )
          }
        >
          B
        </Button>
        {(["left", "center", "right"] as const).map((a) => (
          <Button
            key={a}
            type="button"
            size="sm"
            variant={align === a ? "outline" : "ghost"}
            className="h-7 px-2"
            onClick={() => patch(setFieldStyle(getHtml(), field.name, { "text-align": a }))}
          >
            {a[0].toUpperCase()}
          </Button>
        ))}
        <input
          type="color"
          value={/^#/.test(color) ? color : "#ffffff"}
          onChange={(e) => patch(setFieldStyle(getHtml(), field.name, { color: e.target.value }))}
          className="h-7 w-8 cursor-pointer bg-transparent ml-auto"
          aria-label="Color"
        />
      </div>
    </div>
  );
}
