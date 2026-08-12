"use client";

import { useState, useEffect } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Hash, MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptionPanelProps {
  carouselId: string;
  caption?: string;
  hashtags?: string[];
  onSaved?: () => void;
}

export function CaptionPanel({
  carouselId,
  caption = "",
  hashtags = [],
  onSaved,
}: CaptionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption);
  const [draftTags, setDraftTags] = useState(hashtags.join(" "));
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftCaption(caption);
    setDraftTags(hashtags.join(" "));
  }, [caption, hashtags]);

  const parsedTags = draftTags
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

  const dirty =
    draftCaption !== (caption || "") ||
    parsedTags.join(" ") !== hashtags.join(" ");

  const handleCopy = async (text: string, type: "caption" | "hashtags") => {
    await navigator.clipboard.writeText(text);
    if (type === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/carousels/${carouselId}/caption`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: draftCaption, hashtags: parsedTags }),
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-border bg-surface">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          Caption & hashtags
          {dirty && <span className="text-accent">· sin guardar</span>}
        </span>
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                Caption
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] gap-1 px-1.5"
                disabled={!draftCaption.trim()}
                onClick={() => handleCopy(draftCaption, "caption")}
              >
                {copiedCaption ? (
                  <Check className="h-2.5 w-2.5 text-green-500" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
                {copiedCaption ? "Copied" : "Copy"}
              </Button>
            </div>
            <textarea
              value={draftCaption}
              onChange={(e) => setDraftCaption(e.target.value)}
              rows={3}
              placeholder="Escribe el caption de Instagram…"
              className="w-full text-xs text-foreground bg-muted rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-2.5 w-2.5" />
                Hashtags ({parsedTags.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] gap-1 px-1.5"
                disabled={parsedTags.length === 0}
                onClick={() =>
                  handleCopy(parsedTags.map((h) => `#${h}`).join(" "), "hashtags")
                }
              >
                {copiedHashtags ? (
                  <Check className="h-2.5 w-2.5 text-green-500" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
                {copiedHashtags ? "Copied" : "Copy All"}
              </Button>
            </div>
            <input
              value={draftTags}
              onChange={(e) => setDraftTags(e.target.value)}
              placeholder="marca, carrusel, instagram"
              className="w-full text-xs bg-muted rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {parsedTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={!dirty || saving}
            onClick={handleSave}
          >
            <Save className="h-3 w-3" />
            {saving ? "Guardando…" : "Guardar caption"}
          </Button>
        </div>
      )}
    </div>
  );
}
