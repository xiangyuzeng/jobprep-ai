"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useInterviewSimulator,
  computeAggregateScores,
} from "@/hooks/useInterviewSimulator";
import SimulatorSetupPanel from "@/components/simulator/SimulatorSetupPanel";
import SimulatorQuestionQueue from "@/components/simulator/SimulatorQuestionQueue";
import {
  isRiskAuditReport,
  type VulnerabilityData,
} from "@/types/risk-audit";

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

interface VulnerabilityReportRow {
  id: string;
  resume_id: string;
  vulnerabilities: unknown;
  created_at: string;
}

interface Props {
  boards: Board[];
  pastSessions: PastSession[];
  preselectedBoardId?: string;
  vulnerabilityReports?: VulnerabilityReportRow[];
  preselectedMode?: string;
  preselectedVulnerabilityId?: string;
  preselectedRiskItemId?: string;
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
  pastSessions: initialPastSessions,
  preselectedBoardId,
  vulnerabilityReports,
  preselectedMode,
  preselectedVulnerabilityId,
  preselectedRiskItemId,
}: Props) {
  const sim = useInterviewSimulator();
  const [pastSessions, setPastSessions] = useState(initialPastSessions);
  const autoStartedRef = useRef(false);

  // Auto-start for "Practice This" single-item flow
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (
      preselectedMode === "skeptical" &&
      preselectedVulnerabilityId &&
      preselectedRiskItemId
    ) {
      const vr = vulnerabilityReports?.find(
        (v) => v.id === preselectedVulnerabilityId
      );
      if (vr && isRiskAuditReport(vr.vulnerabilities as VulnerabilityData)) {
        autoStartedRef.current = true;
        sim.startSession({
          companyName: "Resume Risk Audit",
          role: "Candidate",
          roundType: "vulnerability",
          interviewerMode: "skeptical",
          questionCount: 1,
          vulnerabilityData: vr.vulnerabilities,
          singleRiskItemId: preselectedRiskItemId,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteSession = async (e: React.MouseEvent, session: PastSession) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${session.role} at ${session.company_name}" session? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/simulator/sessions?id=${session.id}`, { method: "DELETE" });
      if (res.ok) {
        setPastSessions((prev) => prev.filter((s) => s.id !== session.id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete session");
      }
    } catch {
      alert("Failed to delete session");
    }
  };

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
          vulnerabilityReports={vulnerabilityReports}
          preselectedMode={preselectedMode}
          preselectedVulnerabilityId={preselectedVulnerabilityId}
          preselectedRiskItemId={preselectedRiskItemId}
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
                <div
                  key={s.id}
                  className="group"
                  style={{
                    position: "relative",
                    borderBottom:
                      i < pastSessions.length - 1
                        ? "1px solid var(--paper-dark)"
                        : "none",
                  }}
                >
                  <Link
                    href={`/dashboard/simulator/${s.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 14px",
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
                  <button
                    onClick={(e) => handleDeleteSession(e, s)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: 4,
                      borderRadius: 4,
                      border: "none",
                      background: "transparent",
                      color: "var(--ink-light)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#c23616";
                      e.currentTarget.style.background = "rgba(194,54,22,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--ink-light)";
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Delete session"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
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
