"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useInterviewSimulator,
  computeAggregateScores,
} from "@/hooks/useInterviewSimulator";
import SimulatorSetupPanel from "@/components/simulator/SimulatorSetupPanel";
import SimulatorQuestionQueue from "@/components/simulator/SimulatorQuestionQueue";

// Lazy-load heavy components (Recharts, speech APIs)
const SimulatorActivePanel = dynamic(
  () => import("@/components/simulator/SimulatorActivePanel"),
  { ssr: false }
);
const SimulatorFeedbackCard = dynamic(
  () => import("@/components/simulator/SimulatorFeedbackCard"),
  { ssr: false }
);
const SimulatorResultsPanel = dynamic(
  () => import("@/components/simulator/SimulatorResultsPanel"),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Module {
  title: string;
  cards: Array<{ num: number; q: string; a: string; qtype: string }>;
}

interface Board {
  id: string;
  company_name: string;
  role: string;
  round_type: string;
  modules: Module[];
  status: string;
}

interface PastSession {
  id: string;
  company_name: string;
  role: string;
  round_type: string;
  interviewer_mode: string;
  status: string;
  overall_score: number | null;
  question_count: number;
  created_at: string;
  completed_at: string | null;
}

interface Props {
  boards: Board[];
  pastSessions: PastSession[];
  preselectedBoardId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 70) return "#2d6a4f";
  if (score >= 50) return "#c9a84c";
  return "#c23616";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SimulatorPageClient({
  boards,
  pastSessions,
  preselectedBoardId,
}: Props) {
  const sim = useInterviewSimulator();

  const {
    phase,
    questions,
    currentIndex,
    answers,
    config,
    isLoading,
    isListening,
    transcript,
    metrics,
    isSupported,
  } = sim;

  // Determine which panel to render
  if (phase === "setup") {
    return (
      <div>
        <SimulatorSetupPanel
          boards={boards}
          onStart={sim.startSession}
          isLoading={isLoading}
          preselectedBoardId={preselectedBoardId}
          isSupported={isSupported}
        />

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div
            style={{
              maxWidth: 600,
              margin: "24px auto 0",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-light)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Past Sessions
            </div>
            <div
              style={{
                background: "var(--paper-white)",
                border: "1px solid var(--paper-dark)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {pastSessions.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/dashboard/simulator/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderBottom:
                      i < pastSessions.length - 1
                        ? "1px solid var(--paper-dark)"
                        : "none",
                    textDecoration: "none",
                    gap: 12,
                  }}
                >
                  {s.overall_score !== null ? (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: scoreColor(s.overall_score),
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {s.overall_score}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--paper-dark)",
                        color: "var(--ink-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {s.status === "in_progress" ? "..." : "—"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-black)",
                        fontFamily: "'Crimson Pro', Georgia, serif",
                      }}
                    >
                      {s.role} at {s.company_name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--ink-light)",
                        marginTop: 2,
                      }}
                    >
                      {s.question_count} questions &middot;{" "}
                      {s.interviewer_mode} &middot; {formatDate(s.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "completed") {
    const aggregateScores = computeAggregateScores(answers);
    return (
      <SimulatorResultsPanel
        answers={answers}
        config={config}
        aggregateScores={aggregateScores}
        onPracticeAgain={() => window.location.reload()}
        onBackToBoard={() => {
          if (config?.boardId) {
            window.location.href = `/dashboard/interview/${config.boardId}`;
          } else {
            window.location.href = "/dashboard/simulator";
          }
        }}
      />
    );
  }

  if (phase === "feedback") {
    const currentAnswer = answers[currentIndex];
    if (!currentAnswer) return null;
    return (
      <div>
        <SimulatorQuestionQueue
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
        />
        <SimulatorFeedbackCard
          answer={currentAnswer}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          onNext={sim.nextQuestion}
          onRetry={sim.retryAnswer}
        />
      </div>
    );
  }

  // Active phases: asking, listening, scoring, follow_up_*
  const currentQuestion = questions[currentIndex] || null;
  return (
    <div>
      <SimulatorQuestionQueue
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
      />
      <SimulatorActivePanel
        phase={phase}
        currentQuestion={currentQuestion}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        companyName={config?.companyName || ""}
        role={config?.role || ""}
        isListening={isListening}
        transcript={transcript}
        metrics={metrics}
        onStopListening={sim.stopListening}
        onSkipQuestion={sim.skipQuestion}
        onSkipTTS={sim.skipTTS}
        onEndEarly={sim.endEarly}
      />
    </div>
  );
}
