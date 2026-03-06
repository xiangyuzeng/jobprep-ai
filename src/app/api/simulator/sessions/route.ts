import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { RiskAuditReport } from "@/types/risk-audit";

export const maxDuration = 15;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Card {
  num: number;
  q: string;
  a: string;
  qtype: string;
}

interface Module {
  title: string;
  cards: Card[];
}

// ---------------------------------------------------------------------------
// Fisher-Yates shuffle
// ---------------------------------------------------------------------------

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// POST — Create new simulator session
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    boardId,
    companyName,
    role,
    roundType,
    interviewerMode = "friendly",
    questionCount = 5,
    selectedModules,
    // Skeptical mode
    vulnerabilityData,
    singleRiskItemId,
  } = body as {
    boardId?: string;
    companyName: string;
    role: string;
    roundType: string;
    interviewerMode: string;
    questionCount: number;
    selectedModules?: string[];
    vulnerabilityData?: RiskAuditReport;
    singleRiskItemId?: string;
  };

  if (!companyName || !role || !roundType) {
    return NextResponse.json(
      { error: "companyName, role, and roundType are required" },
      { status: 400 }
    );
  }

  // Build question list from board
  let questions: Array<{
    text: string;
    type: string;
    referenceAnswer: string;
    moduleTitle: string;
    followUp?: string;
  }> = [];

  if (boardId) {
    const { data: board } = await supabase
      .from("interview_boards")
      .select("modules")
      .eq("id", boardId)
      .eq("user_id", user.id)
      .single();

    if (board?.modules) {
      const modules = board.modules as Module[];

      // Flatten cards from selected modules (or all if none specified)
      const allCards: Array<{
        text: string;
        type: string;
        referenceAnswer: string;
        moduleTitle: string;
      }> = [];

      for (const mod of modules) {
        if (
          selectedModules &&
          selectedModules.length > 0 &&
          !selectedModules.includes(mod.title)
        ) {
          continue;
        }
        for (const card of mod.cards) {
          allCards.push({
            text: card.q,
            type: card.qtype || "B",
            referenceAnswer: card.a || "",
            moduleTitle: mod.title,
          });
        }
      }

      // Shuffle and take requested count
      questions = shuffle(allCards).slice(0, questionCount);
    }
  }

  // Skeptical mode: construct questions from vulnerability data
  if (interviewerMode === "skeptical" && vulnerabilityData && questions.length === 0) {
    const allItems = [
      ...vulnerabilityData.claims_challenged.map((c) => ({
        text: c.likely_question,
        type: "B" as const,
        referenceAnswer: `Defense: ${c.answer_draft}\n\nEvidence to prepare: ${c.evidence_to_prepare || ""}`,
        moduleTitle: "Claims Challenged",
        followUp: c.follow_up,
      })),
      ...vulnerabilityData.narrative_gaps.map((n) => ({
        text: n.likely_question,
        type: "B" as const,
        referenceAnswer: `Defense: ${n.answer_draft}\n\nReframe: ${n.reframe_strategy}`,
        moduleTitle: "Narrative Gaps",
        followUp: n.follow_up,
      })),
      ...vulnerabilityData.technical_depth.map((t) => ({
        text: t.depth_question,
        type: "T" as const,
        referenceAnswer: `Defense: ${t.answer_draft}\n\nMinimum knowledge: ${t.minimum_knowledge}`,
        moduleTitle: "Technical Depth",
        followUp: t.follow_up,
      })),
    ];

    if (singleRiskItemId) {
      // Single-item practice mode
      const allRiskItems = [
        ...vulnerabilityData.claims_challenged,
        ...vulnerabilityData.narrative_gaps,
        ...vulnerabilityData.technical_depth,
      ];
      const targetItem = allRiskItems.find((item) => item.id === singleRiskItemId);
      if (targetItem) {
        const targetQuestion =
          "likely_question" in targetItem
            ? targetItem.likely_question
            : (targetItem as (typeof vulnerabilityData.technical_depth)[number]).depth_question;
        const matchingQ = allItems.find((q) => q.text === targetQuestion);
        if (matchingQ) questions = [matchingQ];
      }
    } else {
      questions = shuffle(allItems).slice(0, questionCount);
    }
  }

  // If no board or no questions found, create placeholder questions
  if (questions.length === 0) {
    questions = [
      {
        text: `Tell me about yourself and why you're interested in the ${role} position at ${companyName}.`,
        type: "B",
        referenceAnswer: "",
        moduleTitle: "General",
      },
      {
        text: "Walk me through a challenging project you've worked on recently.",
        type: "B",
        referenceAnswer: "",
        moduleTitle: "General",
      },
      {
        text: `What relevant skills do you bring to the ${role} role?`,
        type: "T",
        referenceAnswer: "",
        moduleTitle: "General",
      },
      {
        text: "Describe a time when you had to work with a difficult team member.",
        type: "B",
        referenceAnswer: "",
        moduleTitle: "General",
      },
      {
        text: "Where do you see yourself in 5 years?",
        type: "B",
        referenceAnswer: "",
        moduleTitle: "General",
      },
    ].slice(0, questionCount);
  }

  // Insert session
  const { data: session, error: dbError } = await supabase
    .from("simulator_sessions")
    .insert({
      user_id: user.id,
      board_id: boardId || null,
      company_name: companyName,
      role,
      round_type: roundType,
      interviewer_mode: interviewerMode,
      question_count: questions.length,
      selected_questions: questions,
      status: "in_progress",
      current_question_index: 0,
    })
    .select("id")
    .single();

  if (dbError || !session) {
    console.error("Session creation error:", dbError);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sessionId: session.id,
    questions,
  });
}

// ---------------------------------------------------------------------------
// GET — List past sessions
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sessions, error } = await supabase
    .from("simulator_sessions")
    .select(
      "id, company_name, role, round_type, interviewer_mode, status, overall_score, question_count, created_at, completed_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessions: sessions || [] });
}

// ---------------------------------------------------------------------------
// PATCH — Complete session with aggregate scores
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    sessionId,
    overallScore,
    contentScore,
    deliveryScore,
    avgWpm,
    totalFillers,
    avgConfidence,
    totalDurationSecs,
  } = body as {
    sessionId: string;
    overallScore: number;
    contentScore: number;
    deliveryScore: number;
    avgWpm: number;
    totalFillers: number;
    avgConfidence: number;
    totalDurationSecs: number;
  };

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("simulator_sessions")
    .update({
      status: "completed",
      overall_score: overallScore,
      content_score: contentScore,
      delivery_score: deliveryScore,
      avg_wpm: avgWpm,
      total_fillers: totalFillers,
      avg_confidence: avgConfidence,
      total_duration_secs: totalDurationSecs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Session completion error:", updateError);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/simulator/sessions?id=xxx — delete a simulator session
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("simulator_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
