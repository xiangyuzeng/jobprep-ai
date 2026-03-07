"use client";

import { useState } from "react";
import { useSpeechAnalytics, type ConfidenceBreakdown } from "@/hooks/useSpeechAnalytics";
import { type ScoreResult } from "@/hooks/useInterviewSimulator";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  Tooltip,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeechPracticePanelProps {
  question: string;
  questionType?: string;
  referenceAnswer?: string;
  companyName?: string;
  role?: string;
  onBack: () => void;
  onNextQuestion?: () => void;
}

type PanelPhase = "idle" | "recording" | "scoring" | "feedback";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  return "Needs work";
}

function scoreColor(score: number | null): string {
  if (score === null) return "#888";
  if (score >= 70) return "#2d6a4f";
  if (score >= 50) return "#c9a84c";
  return "#c23616";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const CONFIDENCE_LABELS: Record<keyof ConfidenceBreakdown, string> = {
  recognition: "Speech Clarity",
  fillerPenalty: "Filler-Free",
  pace: "Pacing",
  consistency: "Consistency",
};

const CONFIDENCE_TIPS: Record<keyof ConfidenceBreakdown, string> = {
  recognition: "Speak more clearly and enunciate each word",
  fillerPenalty: "Pause instead of using filler words like 'um' or 'like'",
  pace: "Aim for 120-160 words per minute for ideal pace",
  consistency: "Maintain a steady speaking rhythm throughout your answer",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeechPracticePanel({
  question,
  questionType,
  referenceAnswer,
  companyName,
  role,
  onBack,
  onNextQuestion,
}: SpeechPracticePanelProps) {
  const { isListening, isSupported, start, stop, reset, transcript, metrics } =
    useSpeechAnalytics();

  const [phase, setPhase] = useState<PanelPhase>("idle");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showImprovedAnswer, setShowImprovedAnswer] = useState(false);

  const hasData = metrics.wpmHistory.length > 0;

  // ------- Phase handlers -------

  const handleStart = () => {
    reset();
    start();
    setPhase("recording");
    setScoreResult(null);
    setShowImprovedAnswer(false);
  };

  const handleStopAndScore = async () => {
    stop();
    setPhase("scoring");
    try {
      const res = await fetch("/api/simulator/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "practice-" + Date.now(),
          questionIndex: 0,
          questionText: question,
          questionType: questionType || "B",
          referenceAnswer,
          transcript,
          duration: metrics.duration,
          wpm: metrics.wpm,
          fillerCount: metrics.fillerCount,
          confidenceScore: metrics.confidenceScore,
          interviewerMode: "friendly",
          companyName: companyName || "Practice",
          role: role || "General",
        }),
      });
      const data = await res.json();
      setScoreResult(data);
      setPhase("feedback");
    } catch {
      setPhase("feedback");
    }
  };

  const handleTryAgain = () => {
    reset();
    setScoreResult(null);
    setShowImprovedAnswer(false);
    setPhase("idle");
  };

  // ------- Not supported -------

  if (!isSupported) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎙️</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
          Speech Recognition Not Available
        </h3>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, maxWidth: 400, margin: "0 auto 20px" }}>
          Your browser doesn&apos;t support the Web Speech API. Please use Chrome or Edge for the speech practice feature.
        </p>
        <button
          onClick={onBack}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f0e8", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Back to Answer
        </button>
      </div>
    );
  }

  // ------- Shared sub-components -------

  const renderMetricCards = () => (
    <div className="sp-metric-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
      {/* WPM */}
      <div style={{
        textAlign: "center", padding: "12px 8px", borderRadius: 12,
        background: "#f5f0e8", border: "1px solid #d4c9b5",
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: wpmColor(metrics.wpm), fontFamily: "'JetBrains Mono', monospace" }}>
          {metrics.wpm}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
          WPM
        </div>
        <div style={{ fontSize: 10, color: wpmColor(metrics.wpm), marginTop: 2, fontWeight: 500 }}>
          {metrics.wpm > 0 ? wpmLabel(metrics.wpm) : "--"}
        </div>
      </div>

      {/* Fillers */}
      <div style={{
        textAlign: "center", padding: "12px 8px", borderRadius: 12,
        background: "#f5f0e8", border: "1px solid #d4c9b5",
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: fillerColor(metrics.fillerCount), fontFamily: "'JetBrains Mono', monospace" }}>
          {metrics.fillerCount}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Fillers
        </div>
        <div style={{ fontSize: 10, color: fillerColor(metrics.fillerCount), marginTop: 2, fontWeight: 500 }}>
          {fillerLabel(metrics.fillerCount)}
        </div>
      </div>

      {/* Confidence */}
      <div style={{
        textAlign: "center", padding: "12px 8px", borderRadius: 12,
        background: "#f5f0e8", border: "1px solid #d4c9b5",
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: confColor(metrics.confidenceScore), fontFamily: "'JetBrains Mono', monospace" }}>
          {metrics.confidenceScore}%
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Confidence
        </div>
        <div style={{ fontSize: 10, color: confColor(metrics.confidenceScore), marginTop: 2, fontWeight: 500 }}>
          {metrics.confidenceScore > 0 ? confLabel(metrics.confidenceScore) : "--"}
        </div>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div style={{ marginBottom: 16 }}>
      {/* WPM Chart */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Speaking Pace (WPM)
        </div>
        <div style={{ background: "#f5f0e8", borderRadius: 10, border: "1px solid #d4c9b5", padding: "8px 4px 4px" }}>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={metrics.wpmHistory} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <ReferenceArea y1={120} y2={160} fill="#E8F5E9" fillOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#bbb" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#bbb" }} tickLine={false} axisLine={false} domain={[0, 220]} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
                formatter={(value) => [`${value} WPM`, "Pace"]}
                labelFormatter={(l) => `${l}s`}
              />
              <Area
                type="monotone"
                dataKey="wpm"
                stroke="#c9a84c"
                strokeWidth={2}
                fill="url(#wpmGrad)"
                isAnimationActive={true}
                animationDuration={300}
                dot={{ r: 3, fill: "#c9a84c" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#2d6a4f", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#E8F5E9", border: "1px solid #A5D6A7", display: "inline-block" }} />
              Ideal zone (120-160)
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Chart */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Confidence Score
        </div>
        <div style={{ background: "#f5f0e8", borderRadius: 10, border: "1px solid #d4c9b5", padding: "8px 4px 4px" }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={metrics.confidenceHistory} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#bbb" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#bbb" }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
                formatter={(value) => [`${value}%`, "Confidence"]}
                labelFormatter={(l) => `${l}s`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1a1a1a"
                strokeWidth={2}
                dot={{ r: 3, fill: "#1a1a1a" }}
                isAnimationActive={true}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTranscript = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {phase === "recording" ? "Live Transcript" : "Transcript"}
      </div>
      <div style={{
        background: "#faf7f0", borderRadius: 10, border: "1px solid #d4c9b5",
        padding: "12px 14px", maxHeight: 120, overflowY: "auto",
        fontSize: 13, lineHeight: 1.6, color: "#333",
      }}>
        {transcript || (
          <span style={{ color: "#bbb", fontStyle: "italic" }}>
            {isListening ? "Start speaking..." : "No transcript recorded"}
          </span>
        )}
      </div>
      {metrics.fillerCount > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Object.entries(metrics.fillerWords).map(([word, count]) => (
            <span
              key={word}
              style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: "#f8f3e6", color: "#c23616", fontWeight: 500,
              }}
            >
              &ldquo;{word}&rdquo; x{count}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // ------- Feedback card -------

  const renderFeedbackCard = () => {
    if (!scoreResult) {
      return (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#888", fontSize: 13 }}>
          Scoring failed. Review your delivery metrics above and try again.
        </div>
      );
    }

    if (scoreResult.timedOut) {
      return (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#c9a84c", fontSize: 13 }}>
          Scoring timed out. Review your delivery metrics above and try a more concise answer.
        </div>
      );
    }

    const dimensions = [
      { label: "Relevance", value: scoreResult.relevance },
      { label: "Specificity", value: scoreResult.specificity },
      { label: "Structure", value: scoreResult.structure },
      { label: "Content Quality", value: scoreResult.contentQuality },
    ];

    const validScores = dimensions.map(d => d.value).filter((v): v is number => v !== null);
    const overallScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

    // Find lowest confidence sub-score for tip
    const breakdown = metrics.confidenceBreakdown;
    const breakdownEntries = (Object.entries(breakdown) as [keyof ConfidenceBreakdown, number][]);
    const lowestEntry = breakdownEntries.reduce((min, entry) => entry[1] < min[1] ? entry : min, breakdownEntries[0]);

    return (
      <div style={{ marginBottom: 16 }}>
        {/* Overall Score */}
        <div style={{
          textAlign: "center", padding: "16px", marginBottom: 12,
          borderRadius: 12, background: "#f5f0e8", border: "1px solid #d4c9b5",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Overall Score
          </div>
          <div style={{
            fontSize: 36, fontWeight: 800, color: scoreColor(overallScore),
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {overallScore}
          </div>
          <div style={{ fontSize: 11, color: scoreColor(overallScore), fontWeight: 600 }}>
            {overallScore >= 80 ? "Excellent" : overallScore >= 70 ? "Good" : overallScore >= 50 ? "Needs Improvement" : "Keep Practicing"}
          </div>
        </div>

        {/* 4 Dimension Bars */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, marginBottom: 12,
          background: "#faf7f0", border: "1px solid #d4c9b5",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Answer Quality
          </div>
          {dimensions.map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#444" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(value), fontFamily: "'JetBrains Mono', monospace" }}>
                  {value ?? "--"}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#e8e0d0", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${value ?? 0}%`,
                  background: scoreColor(value),
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Breakdown */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, marginBottom: 12,
          background: "#faf7f0", border: "1px solid #d4c9b5",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Delivery Breakdown
          </div>
          {breakdownEntries.map(([key, value]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#444" }}>{CONFIDENCE_LABELS[key]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(value), fontFamily: "'JetBrains Mono', monospace" }}>
                  {value}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "#e8e0d0", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${value}%`,
                  background: scoreColor(value),
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          ))}
          {lowestEntry && lowestEntry[1] < 70 && (
            <div style={{
              marginTop: 4, padding: "6px 10px", borderRadius: 8,
              background: "#fff8e1", fontSize: 11, color: "#8d6e00", lineHeight: 1.4,
            }}>
              Tip: {CONFIDENCE_TIPS[lowestEntry[0]]}
            </div>
          )}
        </div>

        {/* AI Feedback */}
        {scoreResult.feedback && (
          <div style={{
            padding: "12px 14px", borderRadius: 12, marginBottom: 12,
            background: "#f0f4f8", border: "1px solid #c8d6e5",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              AI Coaching
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#333" }}>
              {scoreResult.feedback}
            </div>
          </div>
        )}

        {/* Improved Answer (collapsible) */}
        {scoreResult.improvedAnswer && (
          <div style={{
            borderRadius: 12, marginBottom: 12, overflow: "hidden",
            border: "1px solid #d4c9b5", background: "#faf7f0",
          }}>
            <button
              onClick={() => setShowImprovedAnswer(!showImprovedAnswer)}
              style={{
                width: "100%", padding: "10px 14px", border: "none",
                background: "transparent", cursor: "pointer", textAlign: "left",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Improved Answer
              </span>
              <span style={{ fontSize: 12, color: "#888" }}>
                {showImprovedAnswer ? "Hide" : "Show"}
              </span>
            </button>
            {showImprovedAnswer && (
              <div style={{
                padding: "0 14px 12px", fontSize: 13, lineHeight: 1.6,
                color: "#333", borderTop: "1px solid #e8e0d0",
                paddingTop: 10,
              }}>
                {scoreResult.improvedAnswer}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ------- Render -------

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* === IDLE PHASE === */}
      {phase === "idle" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <button
            onClick={handleStart}
            style={{
              width: 80, height: 80, borderRadius: "50%", border: "none",
              background: "#faf7f0", color: "#888", fontSize: 28, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "all 0.3s",
            }}
          >
            🎤
          </button>
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#888" }}>
            Click to start speaking
          </div>
        </div>
      )}

      {/* === RECORDING PHASE === */}
      {phase === "recording" && (
        <>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <button
              onClick={handleStopAndScore}
              style={{
                width: 80, height: 80, borderRadius: "50%", border: "none",
                background: "#c23616", color: "#fff", fontSize: 28, cursor: "pointer",
                position: "relative", transition: "all 0.3s",
                boxShadow: "0 0 0 6px rgba(194,54,22,0.2), 0 0 0 12px rgba(194,54,22,0.1)",
                animation: "pulse 2s infinite",
              }}
            >
              🎤
            </button>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#c23616" }}>
              Listening... Click to stop
            </div>
            <div style={{ fontSize: 12, color: "#bbb", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              {formatDuration(metrics.duration)}
            </div>
          </div>

          {(isListening || hasData) && renderMetricCards()}
          {hasData && renderCharts()}
          {(isListening || hasData) && renderTranscript()}

          {/* Done Answering button */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <button
              onClick={handleStopAndScore}
              style={{
                padding: "10px 28px", borderRadius: 10, border: "none",
                background: "#1a1a1a", color: "#fff", fontSize: 13,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Done Answering
            </button>
          </div>
        </>
      )}

      {/* === SCORING PHASE === */}
      {phase === "scoring" && (
        <>
          {hasData && renderMetricCards()}

          <div style={{
            textAlign: "center", padding: "40px 20px", marginBottom: 16,
            borderRadius: 12, background: "#f5f0e8", border: "1px solid #d4c9b5",
          }}>
            <div style={{
              width: 32, height: 32, margin: "0 auto 12px",
              border: "3px solid #d4c9b5", borderTopColor: "#1a1a1a",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>
              AI is evaluating your answer...
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              This takes 2-3 seconds
            </div>
          </div>

          {hasData && renderTranscript()}
        </>
      )}

      {/* === FEEDBACK PHASE === */}
      {phase === "feedback" && (
        <>
          {hasData && renderMetricCards()}
          {renderFeedbackCard()}
          {hasData && renderTranscript()}
          {hasData && renderCharts()}

          {/* Action buttons */}
          <div style={{
            display: "flex", gap: 8, justifyContent: "center",
            paddingTop: 12, marginBottom: 8,
          }}>
            <button
              onClick={handleTryAgain}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "1px solid #d4c9b5",
                background: "#f5f0e8", color: "#444", fontSize: 13,
                fontWeight: 600, cursor: "pointer", flex: 1, maxWidth: 160,
              }}
            >
              🎤 Try Again
            </button>
            {onNextQuestion && (
              <button
                onClick={onNextQuestion}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "#1a1a1a", color: "#fff", fontSize: 13,
                  fontWeight: 600, cursor: "pointer", flex: 1, maxWidth: 160,
                }}
              >
                Next Question →
              </button>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #eee" }}>
        <button
          onClick={onBack}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd",
            background: "#f5f0e8", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          ← Back to Answer
        </button>
        <div style={{ fontSize: 10, color: "#bbb" }}>
          Powered by Web Speech API
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 6px rgba(194,54,22,0.2), 0 0 0 12px rgba(194,54,22,0.1); }
          50% { box-shadow: 0 0 0 10px rgba(194,54,22,0.15), 0 0 0 20px rgba(194,54,22,0.05); }
          100% { box-shadow: 0 0 0 6px rgba(194,54,22,0.2), 0 0 0 12px rgba(194,54,22,0.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          .sp-metric-grid { grid-template-columns: 1fr 1fr !important; }
          .sp-metric-grid > :last-child { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  );
}
