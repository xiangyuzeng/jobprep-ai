"use client";

import { useState, useMemo } from "react";
import type { SimulatorConfig } from "@/hooks/useInterviewSimulator";
import {
  isRiskAuditReport,
  type VulnerabilityData,
} from "@/types/risk-audit";

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
}

interface VulnerabilityReport {
  id: string;
  resume_id: string;
  vulnerabilities: unknown;
  created_at: string;
}

interface Props {
  boards: Board[];
  onStart: (config: SimulatorConfig) => void;
  isLoading: boolean;
  isSupported: boolean;
  preselectedBoardId?: string;
  vulnerabilityReports?: VulnerabilityReport[];
  preselectedMode?: string;
  preselectedVulnerabilityId?: string;
  preselectedRiskItemId?: string;
}

const MODES = [
  {
    key: "friendly" as const,
    label: "Friendly Coach",
    icon: "\u{1F91D}",
    color: "var(--jade-green)",
    desc: "Supportive and encouraging. Asks clarifying follow-ups to help you explore your answers deeper.",
  },
  {
    key: "technical" as const,
    label: "Technical Deep-Diver",
    icon: "\u2699\uFE0F",
    color: "var(--ink-dark)",
    desc: "Precise and methodical. Probes for implementation details, algorithms, and tradeoffs.",
  },
  {
    key: "stress" as const,
    label: "Stress Tester",
    icon: "\u{1F525}",
    color: "var(--vermillion)",
    desc: "Challenging and skeptical. Pushes back on claims and demands evidence and specifics.",
  },
  {
    key: "skeptical" as const,
    label: "Skeptical Auditor",
    icon: "\u{1F50D}",
    color: "var(--gold-accent)",
    desc: "Challenges your resume's weak spots. Questions come directly from your Risk Audit.",
  },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function SimulatorSetupPanel({
  boards,
  onStart,
  isLoading,
  isSupported,
  preselectedBoardId,
  vulnerabilityReports,
  preselectedMode,
  preselectedVulnerabilityId,
}: Props) {
  const [selectedBoardId, setSelectedBoardId] = useState(
    preselectedBoardId || ""
  );
  const [mode, setMode] = useState<
    "friendly" | "technical" | "stress" | "skeptical"
  >(preselectedMode === "skeptical" ? "skeptical" : "friendly");
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedVulnerabilityId, setSelectedVulnerabilityId] = useState(
    preselectedVulnerabilityId || ""
  );

  const selectedBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId),
    [boards, selectedBoardId]
  );

  // Filter vulnerability reports to only those with the new Risk Audit format
  const validVulnReports = useMemo(
    () =>
      (vulnerabilityReports || []).filter((vr) =>
        isRiskAuditReport(vr.vulnerabilities as VulnerabilityData)
      ),
    [vulnerabilityReports]
  );

  const selectedVulnReport = useMemo(
    () => validVulnReports.find((v) => v.id === selectedVulnerabilityId),
    [validVulnReports, selectedVulnerabilityId]
  );

  const companyName = selectedBoard?.company_name || "";
  const role = selectedBoard?.role || "";
  const roundType = selectedBoard?.round_type || "General";

  const totalAvailableQuestions = useMemo(() => {
    if (!selectedBoard) return 0;
    const modules = selectedBoard.modules || [];
    return modules
      .filter(
        (m) =>
          selectedModules.length === 0 || selectedModules.includes(m.title)
      )
      .reduce((sum, m) => sum + (m.cards?.length || 0), 0);
  }, [selectedBoard, selectedModules]);

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedModules([]);
  };

  const toggleModule = (title: string) => {
    setSelectedModules((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const isSkeptical = mode === "skeptical";

  const canStart = isSkeptical
    ? !!selectedVulnReport
    : selectedBoardId && companyName && role;

  const handleStart = () => {
    if (!canStart) return;

    if (isSkeptical && selectedVulnReport) {
      onStart({
        companyName: "Resume Risk Audit",
        role: "Candidate",
        roundType: "vulnerability",
        interviewerMode: "skeptical",
        questionCount,
        vulnerabilityData: selectedVulnReport.vulnerabilities,
      });
    } else {
      onStart({
        boardId: selectedBoardId,
        companyName,
        role,
        roundType,
        interviewerMode: mode,
        questionCount: Math.min(questionCount, totalAvailableQuestions || questionCount),
        selectedModules: selectedModules.length > 0 ? selectedModules : undefined,
      });
    }
  };

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1
        className="font-cinzel"
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--ink-black)",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Mock Interview Simulator
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "var(--ink-mid)",
          fontSize: 14,
          marginBottom: 32,
          fontFamily: "'Crimson Pro', Georgia, serif",
        }}
      >
        Practice with AI-powered voice interviews using your interview board
        questions
      </p>

      {!isSupported && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fdf2f0",
            border: "1px solid var(--vermillion)",
            borderRadius: 6,
            marginBottom: 24,
            fontSize: 13,
            color: "var(--vermillion)",
          }}
        >
          <strong>Note:</strong> Speech recognition requires Chrome or Edge.
          You can still use the simulator in text-only mode on other browsers.
        </div>
      )}

      {/* Interviewer mode */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-mid)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Interviewer Style
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {MODES.map((m) => {
            // Hide skeptical mode if no vulnerability reports
            if (m.key === "skeptical" && validVulnReports.length === 0) return null;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="cursor-pointer"
                style={{
                  padding: "12px 10px",
                  borderRadius: 8,
                  border: `2px solid ${mode === m.key ? m.color : "var(--paper-dark)"}`,
                  background: mode === m.key ? "rgba(255,255,255,0.9)" : "var(--paper-white)",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ink-black)",
                    marginBottom: 4,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-light)",
                    lineHeight: 1.3,
                  }}
                >
                  {m.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Board selector — hidden in skeptical mode */}
      {!isSkeptical && (
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-mid)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Interview Board
          </label>
          <select
            value={selectedBoardId}
            onChange={(e) => handleBoardChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid var(--paper-dark)",
              background: "var(--paper-white)",
              color: "var(--ink-black)",
              fontSize: 14,
              fontFamily: "'Crimson Pro', Georgia, serif",
            }}
          >
            <option value="">Select an interview board...</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.company_name} — {b.role} ({b.round_type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Vulnerability report selector — shown in skeptical mode */}
      {isSkeptical && (
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-mid)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Risk Audit Report
          </label>
          <select
            value={selectedVulnerabilityId}
            onChange={(e) => setSelectedVulnerabilityId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid var(--paper-dark)",
              background: "var(--paper-white)",
              color: "var(--ink-black)",
              fontSize: 14,
              fontFamily: "'Crimson Pro', Georgia, serif",
            }}
          >
            <option value="">Select a risk audit report...</option>
            {validVulnReports.map((vr) => (
              <option key={vr.id} value={vr.id}>
                Risk Audit — {new Date(vr.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
          {validVulnReports.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-light)", marginTop: 6 }}>
              No Risk Audit reports found. Run a vulnerability analysis on a resume first.
            </p>
          )}
        </div>
      )}

      {/* Question count */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-mid)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Questions {!isSkeptical && totalAvailableQuestions > 0 && `(${totalAvailableQuestions} available)`}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className="cursor-pointer"
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 6,
                border: `2px solid ${questionCount === n ? "var(--ink-dark)" : "var(--paper-dark)"}`,
                background:
                  questionCount === n ? "var(--ink-dark)" : "var(--paper-white)",
                color: questionCount === n ? "#fff" : "var(--ink-black)",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Module filter — hidden in skeptical mode */}
      {!isSkeptical && selectedBoard && selectedBoard.modules && selectedBoard.modules.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-mid)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Focus Areas (optional)
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedBoard.modules.map((mod) => (
              <button
                key={mod.title}
                onClick={() => toggleModule(mod.title)}
                className="cursor-pointer"
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: `1px solid ${
                    selectedModules.includes(mod.title)
                      ? "var(--ink-dark)"
                      : "var(--paper-dark)"
                  }`,
                  background: selectedModules.includes(mod.title)
                    ? "var(--ink-dark)"
                    : "transparent",
                  color: selectedModules.includes(mod.title)
                    ? "#fff"
                    : "var(--ink-black)",
                  fontSize: 12,
                  transition: "all 0.15s ease",
                }}
              >
                {mod.title} ({mod.cards?.length || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canStart || isLoading}
        className="cursor-pointer"
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 8,
          border: "none",
          background: canStart && !isLoading ? "var(--vermillion)" : "#ccc",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
          letterSpacing: "0.02em",
          transition: "all 0.15s ease",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading
          ? "Setting up interview..."
          : isSkeptical
            ? "\u{1F50D} Start Skeptical Interview"
            : "\u{1F3A4} Start Interview"}
      </button>
    </div>
  );
}
