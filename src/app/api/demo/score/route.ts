import { anthropic } from "@/lib/claude";
import { NextResponse } from "next/server";
import {
  SIMULATOR_SCORING_SYSTEM_PROMPT,
  FOLLOW_UP_MODIFIERS,
  buildScoringUserMessage,
} from "@/lib/prompts/simulator-scoring";

export const maxDuration = 30;

const DEMO_LIMIT = 5;

interface DemoScoreRequest {
  questionText: string;
  questionType: string;
  referenceAnswer?: string;
  transcript: string;
  duration: number;
  wpm: number;
  fillerCount: number;
  confidenceScore: number;
  companyName?: string;
  role?: string;
}

export async function POST(request: Request) {
  try {
    // Rate limit via cookie
    const cookies = request.headers.get("cookie") || "";
    const usageMatch = cookies.match(/demo_score=(\d+)/);
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

    const body: DemoScoreRequest = await request.json();
    const {
      questionText,
      questionType,
      referenceAnswer,
      transcript,
      duration,
      wpm,
      fillerCount,
      confidenceScore,
      companyName,
      role,
    } = body;

    if (!questionText || transcript === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt =
      SIMULATOR_SCORING_SYSTEM_PROMPT + FOLLOW_UP_MODIFIERS.friendly;

    const userMessage = buildScoringUserMessage({
      companyName: companyName || "Practice",
      role: role || "General",
      questionType: questionType || "B",
      questionText,
      transcript,
      referenceAnswer,
      wpm,
      fillerCount,
      confidenceScore,
      duration,
    });

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

    const jsonResponse = NextResponse.json({
      relevance: scores.relevance,
      specificity: scores.specificity,
      structure: scores.structure,
      contentQuality: scores.content_quality,
      feedback: scores.feedback,
      improvedAnswer: scores.improved_answer,
      followUp: scores.follow_up,
      answerId: null,
    });

    // Increment usage cookie
    jsonResponse.headers.set(
      "Set-Cookie",
      `demo_score=${usage + 1}; Max-Age=3600; Path=/; SameSite=Lax`
    );

    return jsonResponse;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return NextResponse.json({
        relevance: null,
        specificity: null,
        structure: null,
        contentQuality: null,
        feedback:
          "Scoring timed out. Try answering more concisely next time.",
        improvedAnswer: null,
        followUp: null,
        answerId: null,
        timedOut: true,
      });
    }

    console.error("Demo scoring error:", error);
    return NextResponse.json(
      { error: "Scoring failed" },
      { status: 500 }
    );
  }
}
