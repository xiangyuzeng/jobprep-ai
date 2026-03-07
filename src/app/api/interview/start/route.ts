import { createClient } from "@/lib/supabase/server";
import { streamClaude } from "@/lib/claude";
import { BOARD_QUESTIONS_PROMPT } from "@/lib/prompts/board-questions";
import { VULNERABILITY_BOARD_QUESTIONS_PROMPT } from "@/lib/prompts/board-questions-vulnerability";
import { checkLimit, incrementUsage } from "@/lib/usage";
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

    // Usage limit check
    const limitCheck = await checkLimit(supabase, user.id, "boards");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Monthly limit reached", limitReached: true, ...limitCheck },
        { status: 403 }
      );
    }

    const { companyName, role, roundType, language, jobDescription, interviewerInfo, vulnerabilityData, sourceType, sourceId, dossier, templateId } =
      await request.json();

    if (!templateId && (!companyName || !role || !roundType)) {
      return NextResponse.json(
        { error: "Company name, role, and round type are required" },
        { status: 400 }
      );
    }

    // Template-based board creation — skip question generation
    if (templateId) {
      const { BOARD_TEMPLATES } = await import("@/lib/board-templates");
      const template = BOARD_TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      const { data: board, error: dbError } = await supabase
        .from("interview_boards")
        .insert({
          user_id: user.id,
          company_name: template.company,
          role: template.role,
          round_type: template.roundType,
          language: template.language,
          board_type: template.boardType,
          qtypes: template.qtypes,
          modules: template.modules,
          total_questions: template.questionCount,
          modules_total: template.moduleCount,
          source_type: "template",
          source_id: null,
          dossier: null,
          status: "generating_answers",
          modules_completed: 0,
        })
        .select("id")
        .single();

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      await incrementUsage(supabase, user.id, "boards");
      return NextResponse.json({ boardId: board!.id });
    }

    // Create board record
    const { data: board, error: dbError } = await supabase
      .from("interview_boards")
      .insert({
        user_id: user.id,
        company_name: companyName,
        role,
        round_type: roundType,
        language: language || "en",
        job_description: jobDescription,
        interviewer_info: interviewerInfo,
        source_type: sourceType || "manual",
        source_id: sourceId || null,
        dossier: dossier || null,
        status: "generating_questions",
      })
      .select("id")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    await incrementUsage(supabase, user.id, "boards");

    // Generate questions
    let userMessage = `Company: ${companyName}
Role: ${role}
Interview Round: ${roundType}
Language: ${language || "en"}`;

    if (jobDescription) {
      userMessage += `\n\nJob Description:\n${jobDescription}`;
    }
    if (interviewerInfo) {
      userMessage += `\n\nInterviewer Info:\n${interviewerInfo}`;
    }
    if (vulnerabilityData) {
      userMessage += `\n\nRESUME VULNERABILITY ANALYSIS:\n${JSON.stringify(vulnerabilityData)}`;
    }
    if (dossier) {
      const { formatDossierContext } = await import("@/lib/dossier");
      userMessage += `\n\n${formatDossierContext(dossier)}`;
    }

    const systemPrompt = vulnerabilityData
      ? VULNERABILITY_BOARD_QUESTIONS_PROMPT
      : BOARD_QUESTIONS_PROMPT;

    const stream = await streamClaude({
      systemPrompt,
      userMessage,
      maxTokens: 8192,
    });

    let fullResponse = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
      }
    }

    // Parse questions JSON
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await supabase
        .from("interview_boards")
        .update({ status: "failed" })
        .eq("id", board.id);
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    // Save questions (without answers) to database
    await supabase
      .from("interview_boards")
      .update({
        board_type: result.board_type,
        qtypes: result.qtypes,
        modules: result.modules,
        total_questions: result.total_questions || result.modules.reduce(
          (sum: number, m: { cards: unknown[] }) => sum + m.cards.length, 0
        ),
        modules_total: result.modules.length,
        status: "generating_answers",
      })
      .eq("id", board.id);

    // Return board ID — client will drive module-by-module answer generation
    return NextResponse.json({ boardId: board.id });
  } catch (err) {
    console.error("Interview start error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

