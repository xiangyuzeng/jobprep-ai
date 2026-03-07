import { streamClaude, createStreamResponse } from "@/lib/claude";
import { JD_ANALYZER_PROMPT } from "@/lib/prompts/jd-analyzer";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const DEMO_LIMIT = 3;

export async function POST(request: Request) {
  try {
    // Rate limit via cookie
    const cookies = request.headers.get("cookie") || "";
    const usageMatch = cookies.match(/demo_analyze=(\d+)/);
    const usage = usageMatch ? parseInt(usageMatch[1]) : 0;

    if (usage >= DEMO_LIMIT) {
      return NextResponse.json(
        {
          error: "Demo limit reached. Sign up for unlimited access!",
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const { jobDescription } = await request.json();

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a job description (at least 50 characters)" },
        { status: 400 }
      );
    }

    const stream = await streamClaude({
      systemPrompt: JD_ANALYZER_PROMPT,
      userMessage: jobDescription,
      maxTokens: 4096,
    });

    const response = createStreamResponse(stream);

    // Increment usage cookie
    response.headers.set(
      "Set-Cookie",
      `demo_analyze=${usage + 1}; Max-Age=3600; Path=/; SameSite=Lax`
    );

    return response;
  } catch (err) {
    console.error("Demo analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
