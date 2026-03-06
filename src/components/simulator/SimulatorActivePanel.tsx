"use client";

import { useState, useEffect, useRef } from "react";
import type { SimulatorPhase, SimulatorQuestion } from "@/hooks/useInterviewSimulator";
import type { SpeechMetrics } from "@/hooks/useSpeechAnalytics";

interface Props {
  phase: SimulatorPhase;
  currentQuestion: SimulatorQuestion;
  followUpQuestion?: string | null;
  currentIndex: number;
  totalQuestions: number;
  companyName: string;
  role: string;
  isListening: boolean;
  transcript: string;
  metrics: SpeechMetrics;
  onStopListening: () => void;
  onSkipQuestion: () => void;
  onSkipTTS: () => void;
  onEndEarly: () => void;
}

// Helpers — match SpeechPracticePanel patterns
function wpmColor(wpm: number): string {
  if (wpm >= 120 && wpm <= 160) return "#2d6a4f";
  if (wpm < 90 || wpm > 180) return "#c23616";
  return "#c9a84c";
}
function wpmLabel(wpm: number): string {
  if (wpm >= 120 && wpm <= 160) return "Ideal pace";
  if (wpm < 120) return "Too slow";
  return "Too fast";
}
function fillerColor(count: number): string {
  if (count <= 2) return "#2d6a4f";
  if (count <= 5) return "#c9a84c";
  return "#c23616";
}
function fillerLabel(count: number): string {
  if (count <= 2) return "Excellent";
  if (count <= 5) return "Moderate";
  return "High";
}
function confColor(score: number): string {
  if (score >= 70) return "#2d6a4f";
  if (score >= 50) return "#c9a84c";
  return "#c23616";
}
function confLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Fair";
  return "Low";
}

const QTYPE_INFO: Record<string, { color: string; bg: string; desc: string }> = {
  B: { color: "#1a1a1a", bg: "#ede6d6", desc: "Behavioral" },
  T: { color: "#c23616", bg: "#fdf2f0", desc: "Technical" },
  P: { color: "#2d6a4f", bg: "#edf5f0", desc: "Problem" },
  C: { color: "#c9a84c", bg: "#f8f3e6", desc: "Case" },
  S: { color: "#555555", bg: "#f0ede7", desc: "Scenario" },
  L: { color: "#a02010", bg: "#fdf2f0", desc: "Leadership" },
};

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SimulatorActivePanel({
  phase,
  currentQuestion,
  followUpQuestion,
  currentIndex,
  totalQuestions,
  companyName,
  role,
  isListening,
  transcript,
  metrics,
  onStopListening,
  onSkipQuestion,
  onSkipTTS,
  onEndEarly,
}: Props) {
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const isAsking = phase === "asking" || phase === "follow_up_asking";
  const isListeningPhase = phase === "listening" || phase === "follow_up_listening";
  const isScoring = phase === "scoring" || phase === "follow_up_scoring";
  const isFollowUp = phase.startsWith("follow_up");

  const displayQuestion = isFollowUp && followUpQuestion
    ? followUpQuestion
    : currentQuestion.text;

  const qtInfo = QTYPE_INFO[currentQuestion.type] || QTYPE_INFO.B;

  // Timer
  useEffect(() => {
    if (isListeningPhase) {
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      if (!isListeningPhase) setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isListeningPhase]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderBottom: "1px solid var(--paper-dark)",
          background: "var(--paper-cream)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink-black)",
              fontFamily: "'Cinzel Decorative', serif",
            }}
          >
            Q{currentIndex + 1} of {totalQuestions}
          </span>
          {isFollowUp && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: "var(--gold-accent)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Follow-Up
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-light)",
          }}
        >
          {companyName} \u2014 {role}
        </div>
        <button
          onClick={onEndEarly}
          className="cursor-pointer"
          style={{
            fontSize: 11,
            padding: "4px 10px",
            border: "1px solid var(--paper-dark)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--ink-light)",
          }}
        >
          End Interview
        </button>
      </div>

      {/* Question display */}
      <div
        style={{
          padding: "24px 20px 16px",
          textAlign: "center",
        }}
      >
        {/* Q-type badge */}
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            color: qtInfo.color,
            background: qtInfo.bg,
            marginBottom: 12,
          }}
        >
          {qtInfo.desc}
        </span>

        {/* Question text */}
        <p
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--ink-black)",
            fontFamily: "'Crimson Pro', Georgia, serif",
            lineHeight: 1.5,
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          {displayQuestion}
        </p>

        {/* Speaker animation during asking */}
        {isAsking && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "var(--ink-light)",
              fontSize: 13,
            }}
          >
            <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
              {"\u{1F50A}"}
            </span>
            <span>Speaking...</span>
            <button
              onClick={onSkipTTS}
              className="cursor-pointer"
              style={{
                marginLeft: 8,
                fontSize: 11,
                padding: "3px 10px",
                border: "1px solid var(--paper-dark)",
                borderRadius: 4,
                background: "transparent",
                color: "var(--ink-mid)",
              }}
            >
              Skip to Answer
            </button>
          </div>
        )}
      </div>

      {/* Mic button */}
      {(isListeningPhase || isScoring) && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
          <button
            onClick={isListeningPhase ? onStopListening : undefined}
            disabled={isScoring}
            className="cursor-pointer"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "none",
              background: isListening
                ? "var(--vermillion)"
                : isScoring
                ? "var(--ink-light)"
                : "var(--ink-dark)",
              color: "#fff",
              fontSize: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: isListening ? "pulse 2s ease-in-out infinite" : "none",
              transition: "background 0.2s",
              boxShadow: isListening
                ? "0 0 0 8px rgba(194,54,22,0.15)"
                : "none",
            }}
          >
            {isScoring ? "\u23F3" : isListening ? "\u{1F3A4}" : "\u{1F3A4}"}
          </button>
        </div>
      )}

      {/* Timer */}
      {isListeningPhase && (
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-light)",
            marginBottom: 8,
          }}
        >
          {formatDuration(timer)}
        </div>
      )}

      {/* Scoring indicator */}
      {isScoring && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            fontSize: 14,
            color: "var(--ink-mid)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                border: "2px solid var(--vermillion)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            AI is evaluating your answer...
          </div>
        </div>
      )}

      {/* Live metrics */}
      {(isListeningPhase || isScoring) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            padding: "0 20px",
            marginBottom: 12,
          }}
        >
          {/* WPM */}
          <div
            style={{
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 8,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: wpmColor(metrics.wpm),
              }}
            >
              {metrics.wpm}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-light)", fontWeight: 600 }}>
              WPM
            </div>
            <div style={{ fontSize: 10, color: wpmColor(metrics.wpm), marginTop: 2 }}>
              {wpmLabel(metrics.wpm)}
            </div>
          </div>
          {/* Fillers */}
          <div
            style={{
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 8,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: fillerColor(metrics.fillerCount),
              }}
            >
              {metrics.fillerCount}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-light)", fontWeight: 600 }}>
              Fillers
            </div>
            <div
              style={{
                fontSize: 10,
                color: fillerColor(metrics.fillerCount),
                marginTop: 2,
              }}
            >
              {fillerLabel(metrics.fillerCount)}
            </div>
          </div>
          {/* Confidence */}
          <div
            style={{
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 8,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: confColor(metrics.confidenceScore),
              }}
            >
              {metrics.confidenceScore}%
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-light)", fontWeight: 600 }}>
              Confidence
            </div>
            <div
              style={{
                fontSize: 10,
                color: confColor(metrics.confidenceScore),
                marginTop: 2,
              }}
            >
              {confLabel(metrics.confidenceScore)}
            </div>
          </div>
        </div>
      )}

      {/* Live transcript */}
      {(isListeningPhase || isScoring) && (
        <div
          style={{
            flex: 1,
            margin: "0 20px 12px",
            padding: "12px 16px",
            background: "var(--paper-white)",
            border: "1px solid var(--paper-dark)",
            borderRadius: 8,
            overflowY: "auto",
            maxHeight: 180,
            minHeight: 60,
          }}
        >
          {transcript ? (
            <p
              style={{
                fontSize: 14,
                color: "var(--ink-black)",
                fontFamily: "'Crimson Pro', Georgia, serif",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {transcript}
            </p>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-light)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              Start speaking — your answer will appear here...
            </p>
          )}
          <div ref={transcriptEndRef} />
        </div>
      )}

      {/* Action buttons */}
      {isListeningPhase && (
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 20px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onStopListening}
            className="cursor-pointer"
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              border: "none",
              background: "var(--vermillion)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Done Answering
          </button>
          <button
            onClick={onSkipQuestion}
            className="cursor-pointer"
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              border: "1px solid var(--paper-dark)",
              background: "transparent",
              color: "var(--ink-mid)",
              fontSize: 14,
            }}
          >
            Skip
          </button>
        </div>
      )}

      {/* Spin animation keyframe */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
