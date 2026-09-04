"use client";

import { Terminal } from "lucide-react";

interface AgentGuideProps {
  carouselId: string;
  compact?: boolean;
}

export function AgentGuide({ carouselId, compact = false }: AgentGuideProps) {
  const cmds = [
    `pnpm oc -- make --name "Idea" --topic "Hook" --points "Uno|Dos|Tres" --cta "Guarda"`,
    `pnpm oc -- palette ${carouselId} --background "#111" --text "#fff"`,
    `pnpm oc -- hook variants ${carouselId}  &&  hook pick ${carouselId} 1`,
    `pnpm oc -- export ${carouselId} --format png`,
  ];

  return (
    <div className={compact ? "px-3 py-2 border-b border-border" : "px-4 py-3 border-b border-border"}>
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
        <Terminal className="h-3 w-3" />
        CLI — el agente lo ejecuta
      </p>
      <div className="space-y-1">
        {cmds.map((cmd) => (
          <pre
            key={cmd}
            className="text-[10px] font-mono bg-muted rounded px-2 py-1 overflow-x-auto text-foreground/80"
          >
            {cmd}
          </pre>
        ))}
      </div>
      <details className="mt-2">
        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
          Cómo publicar · docs/publicacion.md
        </summary>
        <ul className="mt-1.5 text-[10px] text-muted-foreground space-y-0.5 leading-relaxed pl-3 list-disc">
          <li>5–10 slides, hook primero, CTA último</li>
          <li>Caption 150–300 chars + ≥3 hashtags</li>
          <li>Export PNG (4:5 = 1080×1350)</li>
          <li>Centro 80 %: el grid 1:1 recorta el 4:5</li>
          <li>El agente da seguimiento hasta el checklist</li>
        </ul>
      </details>
    </div>
  );
}
