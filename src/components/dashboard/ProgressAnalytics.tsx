"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  scoreTrend: Array<{
    date: string;
    overall: number;
    content: number;
    delivery: number;
  }>;
  weekActivity: {
    sessions: number;
    questionsReviewed: number;
    coachChats: number;
  };
  questionsProgress: { reviewed: number; total: number };
  readiness: Array<{
    company: string;
    role: string;
    reviewedPct: number;
    avgScore: number;
    sessions: number;
    boardId: string | null;
  }>;
  streak: number;
  hasData: boolean;
}

// ---------------------------------------------------------------------------
// SVG Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({
  percent,
  size = 44,
  strokeWidth = 4,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 70
      ? "var(--jade-green)"
      : percent >= 40
        ? "var(--gold-accent)"
        : "var(--vermillion)";

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--paper-dark)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={700}
        fill={color}
      >
        {percent}%
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProgressAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // Silent fail — analytics is supplementary
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ marginBottom: 24 }}>
        <CardSkeleton lines={4} />
      </div>
    );
  }

  if (!data || !data.hasData) return null;

  const statCards = [
    {
      emoji: "\uD83D\uDD25",
      value: data.streak > 0 ? `${data.streak}` : "0",
      label: data.streak > 0 ? "day streak" : "Start your streak!",
    },
    {
      emoji: "\uD83D\uDCCA",
      value: `${data.weekActivity.sessions}`,
      label: "mock interviews",
    },
    {
      emoji: "\u2705",
      value: `${data.questionsProgress.reviewed}/${data.questionsProgress.total}`,
      label: "questions mastered",
    },
    {
      emoji: "\uD83D\uDCAC",
      value: `${data.weekActivity.coachChats}`,
      label: "coach chats",
    },
  ];

  const legend = [
    { label: "Overall", color: "var(--vermillion)" },
    { label: "Content", color: "var(--gold-accent)" },
    { label: "Delivery", color: "var(--ink-dark)" },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* ---- Row 1: Activity Summary ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              padding: "10px 8px",
              background: "white",
              border: "1px solid #d4c9b5",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, lineHeight: 1 }}>{card.emoji}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ink-black)",
                lineHeight: 1.3,
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--ink-light)",
                marginTop: 1,
              }}
            >
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Row 2: Score Trend Chart ---- */}
      {data.scoreTrend.length >= 1 && (
        <div style={{ marginBottom: 12 }}>
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
            <ResponsiveContainer width="100%" height={120}>
              <LineChart
                data={data.scoreTrend}
                margin={{ top: 4, right: 12, bottom: 0, left: -10 }}
              >
                <XAxis
                  dataKey="date"
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
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  stroke="var(--vermillion)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--vermillion)" }}
                  name="Overall"
                  isAnimationActive={true}
                  animationDuration={500}
                />
                <Line
                  type="monotone"
                  dataKey="content"
                  stroke="var(--gold-accent)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--gold-accent)" }}
                  name="Content"
                  isAnimationActive={true}
                  animationDuration={500}
                />
                <Line
                  type="monotone"
                  dataKey="delivery"
                  stroke="var(--ink-dark)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--ink-dark)" }}
                  name="Delivery"
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 14,
                paddingBottom: 4,
              }}
            >
              {legend.map((l) => (
                <span
                  key={l.label}
                  style={{
                    fontSize: 9,
                    color: "var(--ink-light)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 3,
                      borderRadius: 2,
                      background: l.color,
                      display: "inline-block",
                    }}
                  />
                  {l.label}
                </span>
              ))}
            </div>

            {/* Hint for single data point */}
            {data.scoreTrend.length === 1 && (
              <p
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  textAlign: "center",
                  margin: "2px 0 4px",
                }}
              >
                Complete more sessions to see your trend
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---- Row 3: Company Readiness Cards ---- */}
      {data.readiness.length > 0 && (
        <div>
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
            Company Readiness
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {data.readiness.map((company) => (
              <div
                key={company.company}
                onClick={() =>
                  router.push(
                    company.boardId
                      ? `/dashboard/interview/${company.boardId}`
                      : "/dashboard/interview"
                  )
                }
                style={{
                  minWidth: 160,
                  padding: "10px 12px",
                  background: "white",
                  border: "1px solid #d4c9b5",
                  borderRadius: 12,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <ProgressRing percent={company.reviewedPct} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink-black)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {company.company}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--ink-light)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {company.role}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 6,
                    fontSize: 9,
                    color: "var(--ink-mid)",
                  }}
                >
                  <span>
                    Avg: {company.avgScore > 0 ? company.avgScore : "N/A"}
                  </span>
                  <span>
                    {company.sessions}{" "}
                    {company.sessions === 1 ? "session" : "sessions"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
