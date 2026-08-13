"use client";

import { useEffect, useState } from "react";
import { Upload, Copy, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaFile {
  name: string;
  url: string;
  size: number;
}

interface MediaPanelProps {
  onUseBackground?: (url: string) => void;
}

export function MediaPanel({ onUseBackground }: MediaPanelProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => {
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((data) => setFiles(data.files || []));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      await fetch("/api/upload", { method: "POST", body });
      refresh();
    } finally {
      setUploading(false);
    }
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <label className="flex items-center justify-center gap-2 h-20 rounded-md border-2 border-dashed border-border cursor-pointer hover:bg-muted/50">
        <Upload className="h-4 w-4" />
        {uploading ? "Subiendo…" : "Subir PNG / JPG / WebP"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
      </label>
      {files.length === 0 && (
        <p className="text-muted-foreground text-center">
          No hay imágenes. Sube una o usa <span className="font-mono">oc upload</span>.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {files.map((file) => (
          <div key={file.url} className="rounded-md border border-border overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={file.name} className="w-full h-20 object-cover" />
            <div className="p-1.5 space-y-1">
              <p className="truncate font-mono text-[10px]">{file.url}</p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1.5 flex-1"
                  onClick={() => copy(file.url)}
                >
                  {copied === file.url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                {onUseBackground && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 flex-1"
                    onClick={() => onUseBackground(file.url)}
                  >
                    <ImageIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
