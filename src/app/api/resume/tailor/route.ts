import { createClient } from "@/lib/supabase/server";
import { streamClaude, createStreamResponse } from "@/lib/claude";
import { RESUME_TAILOR_PROMPT } from "@/lib/prompts/resume-tailor";
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

    const { resumeId, jobDescription, dossier } = await request.json();

    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: "Resume ID and job description are required" },
        { status: 400 }
      );
    }

    // Fetch the resume data
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .select("parsed_data")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (dbError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Create the tailored resume record
    const { data: tailored, error: insertError } = await supabase
      .from("tailored_resumes")
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        job_description: jobDescription,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    let userMessage = `RESUME DATA:
${JSON.stringify(resume.parsed_data, null, 2)}

JOB DESCRIPTION:
${jobDescription}`;

    if (dossier) {
      const { formatDossierContext } = await import("@/lib/dossier");
      userMessage += `\n\n${formatDossierContext(dossier)}`;
    }

    const stream = await streamClaude({
      systemPrompt: RESUME_TAILOR_PROMPT,
      userMessage,
      maxTokens: 8192,
    });

    // Collect full response for database storage while streaming to client
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

          // Parse and save the complete response
          try {
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              await supabase
                .from("tailored_resumes")
                .update({
                  jd_analysis: result.jd_analysis,
                  skill_gap: result.skill_gap,
                  tailored_data: result.suggestions,
                  match_score: result.match_score,
                  keyword_matches: result.keyword_matches,
                  company_name: result.jd_analysis?.company,
                  job_title: result.jd_analysis?.job_title,
                  dossier: dossier || null,
                  status: "completed",
                })
                .eq("id", tailored.id);
            }
          } catch {
            await supabase
              .from("tailored_resumes")
              .update({ status: "failed" })
              .eq("id", tailored.id);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, tailoredResumeId: tailored.id })}\n\n`
            )
          );
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
    console.error("Tailor error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
