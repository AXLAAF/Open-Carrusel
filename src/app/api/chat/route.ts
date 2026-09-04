import { NextRequest, NextResponse } from "next/server";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { getCursorApiKey, isCursorAvailable } from "@/lib/cursor-auth";
import {
  buildFirstTurnPrompt,
  buildFollowUpPrompt,
} from "@/lib/agent-playbook";
import { getBrand } from "@/lib/brand";
import { getCarousel } from "@/lib/carousels";
import { getPreset } from "@/lib/style-presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL = { id: "composer-2.5" } as const;

function agentOptions(apiKey: string) {
  return {
    apiKey,
    model: MODEL,
    local: {
      cwd: process.cwd(),
      settingSources: ["project"] as ("project")[],
    },
  };
}

async function openAgent(apiKey: string, sessionId?: string) {
  const options = agentOptions(apiKey);
  if (sessionId) {
    try {
      const agent = await Agent.resume(sessionId, options);
      return { agent, resumed: true as const };
    } catch (err) {
      console.warn("[chat] resume failed, creating a new agent", err);
    }
  }
  const agent = await Agent.create(options);
  return { agent, resumed: false as const };
}

export async function POST(request: NextRequest) {
  if (!isCursorAvailable()) {
    return NextResponse.json(
      {
        error:
          "CURSOR_API_KEY not set. Add it to .env.local from https://cursor.com/dashboard/integrations",
      },
      { status: 503 }
    );
  }

  let body: {
    message?: string;
    sessionId?: string;
    carouselId?: string;
    stylePresetId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, sessionId, carouselId, stylePresetId } = body;

  if (
    !message ||
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 10000
  ) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  if (
    sessionId &&
    (typeof sessionId !== "string" || !/^[a-zA-Z0-9._:-]{8,128}$/.test(sessionId))
  ) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const brand = await getBrand();
  const carousel = carouselId ? await getCarousel(carouselId) : null;
  const stylePreset = stylePresetId ? await getPreset(stylePresetId) : null;
  const apiKey = getCursorApiKey()!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;
      let cancelled = false;

      const enqueue = (chunk: string) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cancelled = true;
        }
      };

      try {
        const opened = await openAgent(apiKey, sessionId);
        agent = opened.agent;
        enqueue(
          `data: ${JSON.stringify({ sessionId: agent.agentId })}\n\n`
        );

        const prompt = opened.resumed
          ? buildFollowUpPrompt(carousel, message.trim())
          : await buildFirstTurnPrompt(
              brand,
              carousel,
              stylePreset,
              message.trim()
            );
        const run = await agent.send(prompt, {
          onDelta: ({ update }) => {
            if (
              update.type === "text-delta" &&
              "text" in update &&
              typeof update.text === "string" &&
              update.text
            ) {
              enqueue(
                `data: ${JSON.stringify({ type: "token", text: update.text })}\n\n`
              );
            }
          },
        });

        const onAbort = () => {
          cancelled = true;
          if (run.supports("cancel")) void run.cancel();
        };
        request.signal.addEventListener("abort", onAbort, { once: true });

        const result = await run.wait();
        request.signal.removeEventListener("abort", onAbort);

        if (result.status === "error") {
          enqueue(
            `event: error\ndata: ${JSON.stringify({
              error: result.error?.message ?? "Agent run failed",
            })}\n\n`
          );
        } else if (typeof result.result === "string" && result.result) {
          enqueue(
            `data: ${JSON.stringify({ type: "result", text: result.result })}\n\n`
          );
        }

        enqueue(
          `event: done\ndata: ${JSON.stringify({
            sessionId: agent.agentId,
            status: result.status,
          })}\n\n`
        );
        try {
          controller.close();
        } catch {
          // already closed
        }
      } catch (err) {
        const error =
          err instanceof CursorAgentError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Chat failed";
        console.error("[chat] Cursor SDK error", err);
        enqueue(`event: error\ndata: ${JSON.stringify({ error })}\n\n`);
        try {
          controller.close();
        } catch {
          // already closed
        }
      } finally {
        if (agent) {
          try {
            await agent[Symbol.asyncDispose]();
          } catch {
            agent.close();
          }
        }
      }
    },
    cancel() {
      // abort listener on the request signal cancels the run
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
