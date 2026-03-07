import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/claude";
import { NextResponse } from "next/server";
import {
  SIMULATOR_SCORING_SYSTEM_PROMPT,
  FOLLOW_UP_MODIFIERS,
  buildScoringUserMessage,
} from "@/lib/prompts/simulator-scoring";

export const maxDuration = 30;

interface ScoreRequest {
  sessionId: string;
  questionIndex: number;
  questionText: string;
  questionType: string;
  referenceAnswer?: string;
  vulnerabilityContext?: string;
  transcript: string;
  duration: number;
  wpm: number;
  fillerCount: number;
  confidenceScore: number;
  interviewerMode: string;
  companyName: string;
  role: string;
  isFollowUp?: boolean;
  parentAnswerId?: string;
}

export async function POST(request: Request) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate body
  const body: ScoreRequest = await request.json();
  const {
    sessionId,
    questionIndex,
    questionText,
    questionType,
    referenceAnswer,
    vulnerabilityContext,
    transcript,
    duration,
    wpm,
    fillerCount,
    confidenceScore,
    interviewerMode,
    companyName,
    role,
    isFollowUp = false,
    parentAnswerId,
  } = body;

  if (!sessionId || !questionText || transcript === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // 3. Build system prompt with follow-up modifier
  const modifier = FOLLOW_UP_MODIFIERS[interviewerMode] || FOLLOW_UP_MODIFIERS.friendly;
  const systemPrompt = SIMULATOR_SCORING_SYSTEM_PROMPT + modifier;

  // 4. Build user message
  const userMessage = buildScoringUserMessage({
    companyName,
    role,
    questionType,
    questionText,
    transcript,
    referenceAnswer,
    vulnerabilityContext,
    wpm,
    fillerCount,
    confidenceScore,
    duration,
  });

  try {
    // 5. NON-STREAMING call to Claude with 15-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    // 6. Parse JSON from response
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse scoring JSON from Claude response");
    }

    const scores = JSON.parse(jsonMatch[0]) as {
      relevance: number;
      specificity: number;
      structure: number;
      content_quality: number;
      feedback: string;
      improved_answer: string;
      follow_up: string | null;
    };

    // 7. Insert into simulator_answers (skip for practice sessions)
    let answerRow: { id: string } | null = null;

    if (!sessionId.startsWith("practice-")) {
      const { data, error: dbError } = await supabase
        .from("simulator_answers")
        .insert({
          session_id: sessionId,
          question_index: questionIndex,
          question_text: questionText,
          question_type: questionType || null,
          reference_answer: referenceAnswer || null,
          is_follow_up: isFollowUp,
          parent_answer_id: parentAnswerId || null,
          transcript: transcript || null,
          duration_secs: Math.round(duration),
          wpm,
          filler_count: fillerCount,
          confidence_score: confidenceScore,
          content_score: scores.content_quality,
          relevance_score: scores.relevance,
          specificity_score: scores.specificity,
          structure_score: scores.structure,
          ai_feedback: scores.feedback,
          ai_improved_answer: scores.improved_answer,
          follow_up_question: scores.follow_up || null,
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("DB insert error:", dbError);
      }
      answerRow = data;

      // 8. Update session current_question_index
      await supabase
        .from("simulator_sessions")
        .update({ current_question_index: questionIndex })
        .eq("id", sessionId);
    }

    // 9. Return scores
    return NextResponse.json({
      relevance: scores.relevance,
      specificity: scores.specificity,
      structure: scores.structure,
      contentQuality: scores.content_quality,
      feedback: scores.feedback,
      improvedAnswer: scores.improved_answer,
      followUp: scores.follow_up,
      answerId: answerRow?.id || null,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      // Timeout fallback — return delivery metrics only
      return NextResponse.json({
        relevance: null,
        specificity: null,
        structure: null,
        contentQuality: null,
        feedback:
          "Scoring timed out. Your delivery metrics are shown below. Try answering more concisely next time.",
        improvedAnswer: null,
        followUp: null,
        answerId: null,
        timedOut: true,
      });
    }

    console.error("Scoring error:", error);
    return NextResponse.json(
      { error: "Scoring failed" },
      { status: 500 }
    );
  }
}
