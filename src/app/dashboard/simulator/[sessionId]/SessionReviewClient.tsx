"use client";

import dynamic from "next/dynamic";
import type { AnswerRecord, SimulatorConfig } from "@/hooks/useInterviewSimulator";

const SimulatorResultsPanel = dynamic(
  () => import("@/components/simulator/SimulatorResultsPanel"),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Types from DB
// ---------------------------------------------------------------------------

interface DBSession {
  id: string;
  company_name: string;
  role: string;
  round_type: string;
  interviewer_mode: string;
  question_count: number;
  overall_score: number | null;
  content_score: number | null;
  delivery_score: number | null;
  avg_wpm: number | null;
  total_fillers: number | null;
  avg_confidence: number | null;
  total_duration_secs: number | null;
  board_id: string | null;
}

interface DBAnswer {
  id: string;
  question_index: number;
  question_text: string;
  question_type: string | null;
  reference_answer: string | null;
  is_follow_up: boolean;
  parent_answer_id: string | null;
  transcript: string | null;
  duration_secs: number | null;
  wpm: number | null;
  filler_count: number | null;
  confidence_score: number | null;
  content_score: number | null;
  relevance_score: number | null;
  specificity_score: number | null;
  structure_score: number | null;
  ai_feedback: string | null;
  ai_improved_answer: string | null;
  follow_up_question: string | null;
}

interface Props {
  session: DBSession;
  dbAnswers: DBAnswer[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionReviewClient({ session, dbAnswers }: Props) {
  // Map DB answers to AnswerRecord format for the results panel
  // Group follow-ups with their parent answers
  const mainAnswers = dbAnswers.filter((a) => !a.is_follow_up);
  const followUpMap = new Map<string, DBAnswer>();
  for (const a of dbAnswers) {
    if (a.is_follow_up && a.parent_answer_id) {
      followUpMap.set(a.parent_answer_id, a);
    }
  }

  const answers: AnswerRecord[] = mainAnswers.map((a) => {
    const followUpDb = followUpMap.get(a.id);

    return {
      questionText: a.question_text,
      questionType: a.question_type || "B",
      transcript: a.transcript || "",
      metrics: {
        wpm: a.wpm || 0,
        fillerCount: a.filler_count || 0,
        confidenceScore: a.confidence_score || 0,
        confidenceBreakdown: { recognition: 0, fillerPenalty: 0, pace: 0, consistency: 0 },
        duration: a.duration_secs || 0,
        activeSpeakingTime: 0,
        wordCount: 0,
        wpmHistory: [],
        confidenceHistory: [],
        fillerWords: {},
      },
      score: a.relevance_score !== null
        ? {
            relevance: a.relevance_score,
            specificity: a.specificity_score,
            structure: a.structure_score,
            contentQuality: a.content_score,
            feedback: a.ai_feedback || "",
            improvedAnswer: a.ai_improved_answer || null,
            followUp: a.follow_up_question || null,
            answerId: a.id,
          }
        : null,
      followUp: followUpDb
        ? {
            question: followUpDb.question_text,
            transcript: followUpDb.transcript || "",
            metrics: {
              wpm: followUpDb.wpm || 0,
              fillerCount: followUpDb.filler_count || 0,
              confidenceScore: followUpDb.confidence_score || 0,
              confidenceBreakdown: { recognition: 0, fillerPenalty: 0, pace: 0, consistency: 0 },
              duration: followUpDb.duration_secs || 0,
              activeSpeakingTime: 0,
              wordCount: 0,
              wpmHistory: [],
              confidenceHistory: [],
              fillerWords: {},
            },
            score: followUpDb.relevance_score !== null
              ? {
                  relevance: followUpDb.relevance_score,
                  specificity: followUpDb.specificity_score,
                  structure: followUpDb.structure_score,
                  contentQuality: followUpDb.content_score,
                  feedback: followUpDb.ai_feedback || "",
                  improvedAnswer: followUpDb.ai_improved_answer || null,
                  followUp: null,
                  answerId: followUpDb.id,
                }
              : null,
          }
        : undefined,
    };
  });

  const config: SimulatorConfig = {
    boardId: session.board_id || undefined,
    companyName: session.company_name,
    role: session.role,
    roundType: session.round_type,
    interviewerMode: session.interviewer_mode as "friendly" | "technical" | "stress",
    questionCount: session.question_count,
  };

  const aggregateScores = {
    overallScore: session.overall_score || 0,
    contentScore: session.content_score || 0,
    deliveryScore: session.delivery_score || 0,
    avgWpm: session.avg_wpm || 0,
    totalFillers: session.total_fillers || 0,
    avgConfidence: session.avg_confidence || 0,
    totalDurationSecs: session.total_duration_secs || 0,
  };

  return (
    <SimulatorResultsPanel
      answers={answers}
      config={config}
      aggregateScores={aggregateScores}
      sessionId={session.id}
      onPracticeAgain={() => {
        window.location.href = "/dashboard/simulator";
      }}
      onBackToBoard={() => {
        if (session.board_id) {
          window.location.href = `/dashboard/interview/${session.board_id}`;
        } else {
          window.location.href = "/dashboard/simulator";
        }
      }}
      readOnly
    />
  );
}
