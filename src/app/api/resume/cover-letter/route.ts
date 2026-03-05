import { createClient } from "@/lib/supabase/server";
import { streamClaude } from "@/lib/claude";
import { COVER_LETTER_PROMPT } from "@/lib/prompts/cover-letter";
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

    const { tailoredResumeId } = await request.json();

    if (!tailoredResumeId) {
      return NextResponse.json(
        { error: "Tailored resume ID is required" },
        { status: 400 }
      );
    }

    // Fetch tailored resume + original resume data
    const { data: tailored, error: dbError } = await supabase
      .from("tailored_resumes")
      .select("*, resumes(parsed_data)")
      .eq("id", tailoredResumeId)
      .eq("user_id", user.id)
      .single();

    if (dbError || !tailored) {
      return NextResponse.json(
        { error: "Tailored resume not found" },
        { status: 404 }
      );
    }

    const userMessage = `CANDIDATE RESUME:
${JSON.stringify(tailored.resumes.parsed_data, null, 2)}

JOB DESCRIPTION:
${tailored.job_description}

COMPANY: ${tailored.company_name || "Unknown"}
ROLE: ${tailored.job_title || "Unknown"}`;

    const stream = await streamClaude({
      systemPrompt: COVER_LETTER_PROMPT,
      userMessage,
      maxTokens: 2048,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullResponse += event.delta.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              );
            }
          }

          // Save cover letter to database
          await supabase
            .from("tailored_resumes")
            .update({ cover_letter: fullResponse })
            .eq("id", tailoredResumeId);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
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
  } catch (err) {
    console.error("Cover letter error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
