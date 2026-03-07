import { createClient } from "@/lib/supabase/server";
import { streamClaude } from "@/lib/claude";
import { BOARD_ANSWERS_TECHNICAL_PROMPT } from "@/lib/prompts/board-answers-technical";
import { BOARD_ANSWERS_BEHAVIORAL_PROMPT } from "@/lib/prompts/board-answers-behavioral";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleIndex } = await request.json();

    if (typeof moduleIndex !== "number") {
      return NextResponse.json(
        { error: "moduleIndex is required" },
        { status: 400 }
      );
    }

    // Fetch current board
    const { data: board, error: dbError } = await supabase
      .from("interview_boards")
      .select("*")
      .eq("id", boardId)
      .eq("user_id", user.id)
      .single();

    if (dbError || !board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const modules = board.modules;
    if (!modules || moduleIndex >= modules.length) {
      return NextResponse.json(
        { error: "Invalid module index" },
        { status: 400 }
      );
    }

    const module = modules[moduleIndex];

    // Skip if this module already has all answers
    const allAnswered = module.cards?.every(
      (c: { a?: string }) => c.a && c.a.length > 0
    );
    if (allAnswered) {
      return NextResponse.json({
        success: true,
        skipped: true,
        modulesCompleted: board.modules_completed,
        modulesTotal: board.modules_total,
      });
    }

    // Choose prompt based on board type
    const answerPrompt =
      board.board_type === "behavioral"
        ? BOARD_ANSWERS_BEHAVIORAL_PROMPT
        : BOARD_ANSWERS_TECHNICAL_PROMPT;

    // Build the user message
    const questionsText = module.cards
      .map((c: { num: number; qtype: string; q: string }) => `Q${c.num} [${c.qtype}]: ${c.q}`)
      .join("\n");

    let userMessage = `Company: ${board.company_name}
Role: ${board.role}
Round: ${board.round_type}
Module: ${module.title}

Questions to answer:
${questionsText}`;

    if (board.job_description) {
      userMessage += `\n\nJob Description Context:\n${board.job_description}`;
    }
    if (board.dossier) {
      const { formatDossierContext } = await import("@/lib/dossier");
      userMessage += `\n\n${formatDossierContext(board.dossier)}`;
    }

    // Stream from Claude and collect full response — with 50s timeout
    const abortController = new AbortController();
    const streamTimeout = setTimeout(() => abortController.abort(), 50_000);

    let fullResponse = "";
    try {
      const stream = await streamClaude({
        systemPrompt: answerPrompt,
        userMessage,
        maxTokens: 16384,
        signal: abortController.signal,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullResponse += event.delta.text;
        }
      }
    } catch (streamErr) {
      clearTimeout(streamTimeout);
      const isAbort = streamErr instanceof Error && streamErr.name === "AbortError";
      console.error(
        `Module ${moduleIndex} stream ${isAbort ? "timed out (50s)" : "error"}:`,
        streamErr
      );
      return NextResponse.json(
        {
          error: isAbort
            ? "Answer generation timed out. Please retry."
            : `Stream error: ${streamErr instanceof Error ? streamErr.message : String(streamErr)}`,
        },
        { status: isAbort ? 504 : 500 }
      );
    } finally {
      clearTimeout(streamTimeout);
    }

    // Parse answers JSON — strip markdown code fences first
    let jsonText = fullResponse;
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        `Module ${moduleIndex} JSON extraction failed. Raw response (first 500 chars):`,
        fullResponse.slice(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to parse answers from AI response" },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error(
        `Module ${moduleIndex} JSON.parse failed:`,
        parseErr,
        `\nExtracted text (first 500 chars):`,
        jsonMatch[0].slice(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to parse answers JSON" },
        { status: 500 }
      );
    }

    // Re-fetch board to get latest state (avoid race conditions)
    const { data: currentBoard } = await supabase
      .from("interview_boards")
      .select("modules, modules_completed")
      .eq("id", boardId)
      .single();

    if (!currentBoard) {
      return NextResponse.json(
        { error: "Board not found during update" },
        { status: 500 }
      );
    }

    // Merge answers into the module's cards
    const updatedModules = [...currentBoard.modules];
    const answersMap = new Map(
      result.answers.map((a: { num: number; a: string; charCount: number }) => [
        a.num,
        a,
      ])
    );

    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      cards: updatedModules[moduleIndex].cards.map(
        (card: { num: number; q: string; qtype: string }) => {
          const answer = answersMap.get(card.num) as
            | { a: string; charCount: number }
            | undefined;
          return answer
            ? { ...card, a: answer.a, charCount: answer.charCount }
            : card;
        }
      ),
    };

    const newModulesCompleted = (currentBoard.modules_completed || 0) + 1;
    const allDone = newModulesCompleted >= (board.modules_total || updatedModules.length);

    await supabase
      .from("interview_boards")
      .update({
        modules: updatedModules,
        modules_completed: newModulesCompleted,
        status: allDone ? "completed" : "generating_answers",
      })
      .eq("id", boardId);

    return NextResponse.json({
      success: true,
      modulesCompleted: newModulesCompleted,
      modulesTotal: board.modules_total || updatedModules.length,
      allDone,
    });
  } catch (err) {
    console.error("Generate module error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
