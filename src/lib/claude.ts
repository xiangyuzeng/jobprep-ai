import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120_000, // 2-minute global safety net timeout
});

export { anthropic };

export async function streamClaude({
  systemPrompt,
  userMessage,
  maxTokens = 8192,
  signal,
  timeout,
}: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  signal?: AbortSignal;
  timeout?: number;
}) {
  const stream = anthropic.messages.stream(
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    },
    {
      ...(signal ? { signal } : {}),
      ...(timeout ? { timeout } : {}),
    },
  );

  return stream;
}

export function createStreamResponse(
  stream: ReturnType<typeof anthropic.messages.stream>
) {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
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
