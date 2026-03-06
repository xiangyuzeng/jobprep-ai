"use client";

import type { AnswerRecord, SimulatorConfig } from "@/hooks/useInterviewSimulator";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AggregateScores {
  overallScore: number;
  contentScore: number;
  deliveryScore: number;
  avgWpm: number;
  totalFillers: number;
  avgConfidence: number;
  totalDurationSecs: number;
}

interface Props {
  answers: AnswerRecord[];
  config: SimulatorConfig | null;
  aggregateScores: AggregateScores;
  onPracticeAgain: () => void;
  onBackToBoard: () => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 70) return "#2d6a4f";
  if (score >= 50) return "#c9a84c";
  return "#c23616";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 70) return "Good";
  if (score >= 50) return "Adequate";
  if (score >= 30) return "Weak";
  return "Needs Work";
}

function wpmColor(wpm: number): string {
  if (wpm >= 120 && wpm <= 160) return "#2d6a4f";
  if (wpm < 90 || wpm > 180) return "#c23616";
  return "#c9a84c";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function overallQuestionScore(answer: AnswerRecord): number {
  if (!answer.score || answer.score.relevance === null) return 0;
  return Math.round(
    ((answer.score.relevance || 0) +
      (answer.score.specificity || 0) +
      (answer.score.structure || 0) +
      (answer.score.contentQuality || 0)) /
      4
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SimulatorResultsPanel({
  answers,
  config,
  aggregateScores,
  onPracticeAgain,
  onBackToBoard,
  readOnly = false,
}: Props) {
  const {
    overallScore,
    contentScore,
    deliveryScore,
    avgWpm,
    totalFillers,
    avgConfidence,
    totalDurationSecs,
  } = aggregateScores;

  // Build chart data
  const scoreTrendData = answers.map((a, i) => ({
    question: `Q${i + 1}`,
    score: overallQuestionScore(a),
  }));

  const wpmTrendData = answers
    .filter((a) => a.transcript)
    .map((a, i) => ({
      question: `Q${i + 1}`,
      wpm: a.metrics.wpm,
    }));

  // Aggregate filler words across all answers
  const fillerBreakdown: Record<string, number> = {};
  for (const a of answers) {
    if (a.metrics.fillerWords) {
      for (const [word, count] of Object.entries(a.metrics.fillerWords)) {
        fillerBreakdown[word] = (fillerBreakdown[word] || 0) + count;
      }
    }
    if (a.followUp?.metrics.fillerWords) {
      for (const [word, count] of Object.entries(a.followUp.metrics.fillerWords)) {
        fillerBreakdown[word] = (fillerBreakdown[word] || 0) + count;
      }
    }
  }
  const fillerEntries = Object.entries(fillerBreakdown).sort(
    (a, b) => b[1] - a[1]
  );

  const modeLabels: Record<string, string> = {
    friendly: "Friendly Coach",
    technical: "Technical Deep-Diver",
    stress: "Stress Tester",
  };

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "28px 20px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink-black)",
            fontFamily: "'Cinzel Decorative', serif",
            marginBottom: 6,
          }}
        >
          Interview Complete
        </h2>
        {config && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mid)",
              fontFamily: "'Crimson Pro', Georgia, serif",
            }}
          >
            {config.role} at {config.companyName} &middot;{" "}
            {modeLabels[config.interviewerMode] || config.interviewerMode}
          </p>
        )}
      </div>

      {/* Overall score ring */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: `5px solid ${scoreColor(overallScore)}`,
            background: "var(--paper-white)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: scoreColor(overallScore),
                lineHeight: 1,
              }}
            >
              {overallScore}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: scoreColor(overallScore),
                marginTop: 2,
              }}
            >
              {scoreLabel(overallScore)}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "var(--ink-light)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Overall Score
        </div>
      </div>

      {/* Content vs Delivery breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "14px",
            background: "var(--paper-white)",
            border: "1px solid var(--paper-dark)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: scoreColor(contentScore),
            }}
          >
            {contentScore}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-light)",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            Content
          </div>
          <div
            style={{ fontSize: 10, color: "var(--ink-light)", marginTop: 2 }}
          >
            Relevance, specificity, structure
          </div>
        </div>
        <div
          style={{
            padding: "14px",
            background: "var(--paper-white)",
            border: "1px solid var(--paper-dark)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: scoreColor(deliveryScore),
            }}
          >
            {deliveryScore}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-light)",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            Delivery
          </div>
          <div
            style={{ fontSize: 10, color: "var(--ink-light)", marginTop: 2 }}
          >
            Pace, fillers, confidence
          </div>
        </div>
      </div>

      {/* Delivery stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Avg WPM", value: avgWpm, color: wpmColor(avgWpm) },
          {
            label: "Fillers",
            value: totalFillers,
            color: totalFillers <= 5 ? "#2d6a4f" : totalFillers <= 10 ? "#c9a84c" : "#c23616",
          },
          {
            label: "Confidence",
            value: `${avgConfidence}%`,
            color: scoreColor(avgConfidence),
          },
          {
            label: "Duration",
            value: formatDuration(totalDurationSecs),
            color: "var(--ink-black)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "10px 6px",
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 6,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: stat.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{ fontSize: 9, color: "var(--ink-light)", fontWeight: 600 }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Per-question score table */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ink-light)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Question Scores
        </div>
        <div
          style={{
            background: "var(--paper-white)",
            border: "1px solid var(--paper-dark)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {answers.map((a, i) => {
            const qScore = overallQuestionScore(a);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom:
                    i < answers.length - 1
                      ? "1px solid var(--paper-dark)"
                      : "none",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: a.score
                      ? scoreColor(qScore)
                      : "var(--paper-dark)",
                    color: a.score ? "#fff" : "var(--ink-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {a.score ? qScore : "—"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink-black)",
                      fontFamily: "'Crimson Pro', Georgia, serif",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.questionText}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-light)",
                      marginTop: 2,
                    }}
                  >
                    {a.metrics.wpm} WPM &middot; {a.metrics.fillerCount} fillers
                    &middot; {formatDuration(a.metrics.duration)}
                    {a.followUp ? " · Follow-up" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score trend chart */}
      {scoreTrendData.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-light)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Score Trend
          </div>
          <div
            style={{
              background: "var(--paper-white)",
              borderRadius: 10,
              border: "1px solid var(--paper-dark)",
              padding: "10px 6px 6px",
            }}
          >
            <ResponsiveContainer width="100%" height={140}>
              <LineChart
                data={scoreTrendData}
                margin={{ top: 4, right: 12, bottom: 0, left: -10 }}
              >
                <XAxis
                  dataKey="question"
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid #eee",
                  }}
                  formatter={(value) => [`${value}`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--vermillion)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--vermillion)" }}
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* WPM trend chart */}
      {wpmTrendData.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-light)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Speaking Pace Trend
          </div>
          <div
            style={{
              background: "var(--paper-white)",
              borderRadius: 10,
              border: "1px solid var(--paper-dark)",
              padding: "10px 6px 6px",
            }}
          >
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart
                data={wpmTrendData}
                margin={{ top: 4, right: 12, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient
                    id="simWpmGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#c9a84c"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#c9a84c"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <ReferenceArea
                  y1={120}
                  y2={160}
                  fill="#E8F5E9"
                  fillOpacity={0.5}
                />
                <XAxis
                  dataKey="question"
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 220]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid #eee",
                  }}
                  formatter={(value) => [`${value} WPM`, "Pace"]}
                />
                <Area
                  type="monotone"
                  dataKey="wpm"
                  stroke="#c9a84c"
                  strokeWidth={2}
                  fill="url(#simWpmGrad)"
                  dot={{ r: 4, fill: "#c9a84c" }}
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                paddingBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "#2d6a4f",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "#E8F5E9",
                    border: "1px solid #A5D6A7",
                    display: "inline-block",
                  }}
                />
                Ideal zone (120–160)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filler word breakdown */}
      {fillerEntries.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-light)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Filler Words
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {fillerEntries.map(([word, count]) => (
              <span
                key={word}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: "#f8f3e6",
                  color: "#c23616",
                  fontWeight: 500,
                }}
              >
                &ldquo;{word}&rdquo; &times; {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            paddingTop: 8,
          }}
        >
          <button
            onClick={onPracticeAgain}
            className="cursor-pointer"
            style={{
              padding: "10px 28px",
              borderRadius: 6,
              border: "none",
              background: "var(--vermillion)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Practice Again
          </button>
          <button
            onClick={onBackToBoard}
            className="cursor-pointer"
            style={{
              padding: "10px 28px",
              borderRadius: 6,
              border: "1px solid var(--paper-dark)",
              background: "transparent",
              color: "var(--ink-mid)",
              fontSize: 14,
            }}
          >
            Back to Board
          </button>
        </div>
      )}
    </div>
  );
}
