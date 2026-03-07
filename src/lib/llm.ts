import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SupabaseClient } from "@supabase/supabase-js";

export type LLMProvider = "claude" | "openai";

const MODELS = {
  claude: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
} as const;

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120_000 });
  }
  return _anthropic;
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000 });
  }
  return _openai;
}

export async function getProvider(
  supabase: SupabaseClient,
  userId: string
): Promise<LLMProvider> {
  const { data } = await supabase
    .from("profiles")
    .select("preferred_model")
    .eq("id", userId)
    .single();

  if (data?.preferred_model === "openai") return "openai";
  return "claude";
}

// ── Streaming single-turn (replaces streamClaude) ──

export async function streamLLM(
  provider: LLMProvider,
  opts: {
    systemPrompt: string;
    userMessage: string;
    maxTokens?: number;
    signal?: AbortSignal;
    timeout?: number;
  }
) {
  const { systemPrompt, userMessage, maxTokens = 8192, signal, timeout } = opts;

  if (provider === "openai") {
    return getOpenAI().chat.completions.create(
      {
        model: MODELS.openai,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
      {
        ...(signal ? { signal } : {}),
        ...(timeout ? { timeout } : {}),
      }
    );
  }

  return getAnthropic().messages.stream(
    {
      model: MODELS.claude,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    },
    {
      ...(signal ? { signal } : {}),
      ...(timeout ? { timeout } : {}),
    }
  );
}

// ── Normalize stream iteration ──

type AnyStream = ReturnType<Anthropic["messages"]["stream"]> | OpenAI.Chat.Completions.ChatCompletion & { [Symbol.asyncIterator]?: never } | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

export async function* iterateStream(
  stream: AnyStream
): AsyncGenerator<string> {
  for await (const event of stream as AsyncIterable<unknown>) {
    // OpenAI chunk
    if (
      typeof event === "object" &&
      event !== null &&
      "choices" in event
    ) {
      const chunk = event as OpenAI.Chat.Completions.ChatCompletionChunk;
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
    // Anthropic event
    else if (
      typeof event === "object" &&
      event !== null &&
      "type" in event
    ) {
      const e = event as { type: string; delta?: { type: string; text: string } };
      if (e.type === "content_block_delta" && e.delta?.type === "text_delta") {
        yield e.delta.text;
      }
    }
  }
}

// ── Convert stream to SSE Response ──

export function createStreamResponse(
  stream: AnyStream
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const text of iterateStream(stream)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: String(error) })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ── Non-streaming call (replaces anthropic.messages.create) ──

export async function callLLM(
  provider: LLMProvider,
  opts: {
    systemPrompt: string;
    userMessage: string;
    maxTokens?: number;
    signal?: AbortSignal;
    timeout?: number;
  }
): Promise<string> {
  const { systemPrompt, userMessage, maxTokens = 1024, signal, timeout } = opts;

  if (provider === "openai") {
    const response = await getOpenAI().chat.completions.create(
      {
        model: MODELS.openai,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
      {
        ...(signal ? { signal } : {}),
        ...(timeout ? { timeout } : {}),
      }
    );
    return response.choices[0]?.message?.content || "";
  }

  const response = await getAnthropic().messages.create(
    {
      model: MODELS.claude,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    },
    {
      ...(signal ? { signal } : {}),
      ...(timeout ? { timeout } : {}),
    }
  );

  return response.content[0]?.type === "text" ? response.content[0].text : "";
}

// ── Multi-turn streaming with usage (replaces coach's anthropic.messages.stream) ──

export function streamLLMMultiTurn(
  provider: LLMProvider,
  opts: {
    system: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    maxTokens?: number;
    signal?: AbortSignal;
  }
): {
  stream: AsyncIterable<unknown>;
  getUsage: () => Promise<{ inputTokens: number; outputTokens: number }>;
} {
  const { system, messages, maxTokens = 4096, signal } = opts;

  if (provider === "openai") {
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let totalUsage = { inputTokens: 0, outputTokens: 0 };

    const wrappedStream = (async function* () {
      const response = await getOpenAI().chat.completions.create(
        {
          model: MODELS.openai,
          max_tokens: maxTokens,
          stream: true,
          stream_options: { include_usage: true },
          messages: openaiMessages,
        },
        { ...(signal ? { signal } : {}) }
      );
      for await (const chunk of response) {
        if (chunk.usage) {
          totalUsage = {
            inputTokens: chunk.usage.prompt_tokens || 0,
            outputTokens: chunk.usage.completion_tokens || 0,
          };
        }
        yield chunk;
      }
    })();

    return {
      stream: wrappedStream,
      getUsage: async () => totalUsage,
    };
  }

  // Claude path
  const claudeStream = getAnthropic().messages.stream(
    {
      model: MODELS.claude,
      max_tokens: maxTokens,
      system,
      messages,
    },
    { ...(signal ? { signal } : {}) }
  );

  return {
    stream: claudeStream,
    getUsage: async () => {
      const finalMessage = await claudeStream.finalMessage();
      return {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
      };
    },
  };
}
