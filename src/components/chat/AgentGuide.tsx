"use client";

import { Terminal, Sparkles } from "lucide-react";

interface AgentGuideProps {
  carouselId: string;
  compact?: boolean;
}

export function AgentGuide({ carouselId, compact = false }: AgentGuideProps) {
  const cmds = [
    `npm run oc -- compose --name "Idea" --topic "Hook" --points "Uno|Dos|Tres" --cta "Guarda"`,
    `npm run oc -- slide add ${carouselId} --layout hook --title "..."`,
    `npm run oc -- export ${carouselId}`,
  ];

  return (
    <div className={compact ? "px-3 py-2 border-b border-border" : "p-5"}>
      {!compact && (
        <>
          <Sparkles className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-semibold text-sm mb-1">Editor listo para Cursor</h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            No hace falta Claude CLI. El CLI arma el carrusel; tú lo corriges a
            mano en el editor (Diseño, capas, marca). Chat es opcional.
          </p>
        </>
      )}
      {compact && (
        <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <Terminal className="h-3 w-3" />
          CLI / Cursor
        </p>
      )}
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
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        Archivos:{" "}
        <span className="font-mono">data/slides/{carouselId}/&lt;id&gt;.html</span>
      </p>
    </div>
  );
}
