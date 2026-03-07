import { createClient } from "@/lib/supabase/server";
import { streamLLM, createStreamResponse, getProvider } from "@/lib/llm";
import { JD_ANALYZER_PROMPT } from "@/lib/prompts/jd-analyzer";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobDescription } = await request.json();

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a job description (at least 50 characters)" },
        { status: 400 }
      );
    }

    const provider = await getProvider(supabase, user.id);
    const stream = await streamLLM(provider, {
      systemPrompt: JD_ANALYZER_PROMPT,
      userMessage: jobDescription,
      maxTokens: 4096,
    });

    return createStreamResponse(stream);
  } catch (err) {
    console.error("Prepare analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
