"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { FileUp, Link2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportBriefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBriefDialog({
  open,
  onOpenChange,
}: ImportBriefDialogProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [compose, setCompose] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      let res: Response;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("compose", compose ? "true" : "false");
        res = await fetch("/api/import", { method: "POST", body: form });
      } else if (url.trim()) {
        res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim(), compose }),
        });
      } else if (text.trim()) {
        res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), compose }),
        });
      } else {
        throw new Error("Pega una URL, un PDF o texto");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import falló");

      setPreview(data.markdown || null);

      if (compose && data.carousel?.id) {
        onOpenChange(false);
        router.push(`/carousel/${data.carousel.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-oc-overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        />
        <Dialog.Content
          data-oc-dialog
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Importar → brief → compose
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-1">
                URL, Notion público o PDF con texto. Genera un `.md` y opcionalmente
                el carrusel.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-3 text-sm">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                URL / Notion
              </span>
              <input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setFile(null);
                }}
                placeholder="https://… o notion.site/…"
                className="w-full h-9 rounded-md border border-border bg-muted px-3 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FileUp className="h-3 w-3" />
                PDF
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setUrl("");
                }}
                className="w-full text-xs"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">O pega texto</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder={"Título\n- Punto 1\n- Punto 2\nGuarda esto"}
                className="w-full rounded-md border border-border bg-muted p-2 text-sm resize-none"
              />
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={compose}
                onChange={(e) => setCompose(e.target.checked)}
              />
              Crear carrusel ahora (compose)
            </label>

            {error && <p className="text-xs text-destructive">{error}</p>}

            {preview && !compose && (
              <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted p-2 text-[10px] whitespace-pre-wrap">
                {preview}
              </pre>
            )}

            <Button className="w-full" disabled={busy} onClick={() => void run()}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando…
                </>
              ) : compose ? (
                "Importar y crear"
              ) : (
                "Solo generar brief"
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
