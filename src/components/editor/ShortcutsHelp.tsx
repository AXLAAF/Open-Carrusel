"use client";

import * as Dialog from "@radix-ui/react-dialog";

const ROWS: { keys: string; action: string }[] = [
  { keys: "← →", action: "Cambiar slide" },
  { keys: "F", action: "Ventana Instagram" },
  { keys: "/", action: "Enfocar el agente (izquierda)" },
  { keys: "[", action: "Mostrar / ocultar agente" },
  { keys: "]", action: "Mostrar / ocultar estudio" },
  { keys: "E", action: "Editar código HTML" },
  { keys: "P", action: "Publicar (caption, hashtags)" },
  { keys: "?", action: "Esta ayuda" },
  { keys: "⌘ D", action: "Duplicar slide" },
  { keys: "⌘ Z / ⌘ ⇧ Z", action: "Deshacer / rehacer" },
  { keys: "⌘ 0 / ⌘ 1", action: "Ajustar / 100 %" },
  { keys: "⌘ + / ⌘ −", action: "Zoom" },
  { keys: "Espacio + arrastre", action: "Pan en el preview" },
  { keys: "Supr", action: "Borrar slide" },
  { keys: "Esc", action: "Cerrar overlay" },
];

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-4 shadow-xl">
          <Dialog.Title className="text-sm font-semibold mb-3">Atajos</Dialog.Title>
          <ul className="space-y-1.5 text-xs">
            {ROWS.map((row) => (
              <li key={row.keys} className="flex justify-between gap-3">
                <kbd className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {row.keys}
                </kbd>
                <span className="text-foreground text-right">{row.action}</span>
              </li>
            ))}
          </ul>
          <Dialog.Close className="mt-4 text-[11px] text-muted-foreground hover:text-foreground">
            Cerrar
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
