"use client";

import { Terminal, Sparkles } from "lucide-react";

interface AgentGuideProps {
  carouselId: string;
  compact?: boolean;
}

export function AgentGuide({ carouselId, compact = false }: AgentGuideProps) {
  const cmds = [
    `pnpm oc -- get ${carouselId}`,
    `pnpm oc -- slide add ${carouselId} --blank`,
    `pnpm oc -- slides ${carouselId}`,
  ];

  return (
    <div className={compact ? "px-3 py-2 border-b border-border" : "p-5"}>
      {!compact && (
        <>
          <Sparkles className="h-8 w-8 text-accent mb-3" />
          <h3 className="font-semibold text-sm mb-1">Editor listo para Cursor</h3>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            El chat embebido usa Cursor SDK. Sin API key puedes pedir diapositivas
            en este chat de Cursor o usar el CLI. El preview se actualiza solo.
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
