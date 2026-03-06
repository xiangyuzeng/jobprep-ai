"use client";

import { useSpeechAnalytics } from "@/hooks/useSpeechAnalytics";
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
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wpmColor(wpm: number): string {
  if (wpm >= 120 && wpm <= 160) return "#2E7D32";
  if (wpm < 90 || wpm > 180) return "#C62828";
  return "#EF6C00";
}

function wpmLabel(wpm: number): string {
  if (wpm >= 120 && wpm <= 160) return "Ideal pace";
  if (wpm < 120) return "Too slow";
  return "Too fast";
}

function fillerColor(count: number): string {
  if (count <= 2) return "#2E7D32";
  if (count <= 5) return "#EF6C00";
  return "#C62828";
}

function fillerLabel(count: number): string {
  if (count <= 2) return "Excellent";
  if (count <= 5) return "Moderate";
  return "High";
}

function confColor(score: number): string {
  if (score >= 70) return "#2E7D32";
  if (score >= 50) return "#EF6C00";
  return "#C62828";
}

function confLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Fair";
  return "Needs work";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeechPracticePanel({ question, onBack }: SpeechPracticePanelProps) {
  const { isListening, isSupported, start, stop, reset, transcript, metrics } =
    useSpeechAnalytics();

  const hasData = metrics.wpmHistory.length > 0;

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
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Back to Answer
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Mic button */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          onClick={() => (isListening ? stop() : start())}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "none",
            background: isListening ? "#C62828" : "#f5f5f0",
            color: isListening ? "#fff" : "#888",
            fontSize: 28,
            cursor: "pointer",
            position: "relative",
            transition: "all 0.3s",
            boxShadow: isListening
              ? "0 0 0 6px rgba(198,40,40,0.2), 0 0 0 12px rgba(198,40,40,0.1)"
              : "0 2px 8px rgba(0,0,0,0.08)",
            animation: isListening ? "pulse 2s infinite" : "none",
          }}
        >
          🎤
        </button>
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: isListening ? "#C62828" : "#888" }}>
          {isListening ? "Listening... Click to stop" : hasData ? "Click to try again" : "Click to start speaking"}
        </div>
        {hasData && !isListening && (
          <button
            onClick={reset}
            style={{ marginTop: 6, fontSize: 11, color: "#888", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
          >
            Reset
          </button>
        )}
        {(isListening || hasData) && (
          <div style={{ fontSize: 12, color: "#bbb", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {formatDuration(metrics.duration)}
          </div>
        )}
      </div>

      {/* Metric cards */}
      {(isListening || hasData) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {/* WPM */}
          <div style={{
            textAlign: "center", padding: "12px 8px", borderRadius: 12,
            background: "#fff", border: "1px solid #e8e8e4",
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
            background: "#fff", border: "1px solid #e8e8e4",
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
            background: "#fff", border: "1px solid #e8e8e4",
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
      )}

      {/* Charts */}
      {hasData && (
        <div style={{ marginBottom: 16 }}>
          {/* WPM Chart */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Speaking Pace (WPM)
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e4", padding: "8px 4px 4px" }}>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={metrics.wpmHistory} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF6C00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF6C00" stopOpacity={0.02} />
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
                    stroke="#EF6C00"
                    strokeWidth={2}
                    fill="url(#wpmGrad)"
                    isAnimationActive={true}
                    animationDuration={300}
                    dot={{ r: 3, fill: "#EF6C00" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#2E7D32", display: "flex", alignItems: "center", gap: 3 }}>
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
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e4", padding: "8px 4px 4px" }}>
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
                    stroke="#6A1B9A"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#6A1B9A" }}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transcript */}
      {(isListening || hasData) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Live Transcript
          </div>
          <div style={{
            background: "#FAFAF8", borderRadius: 10, border: "1px solid #e8e8e4",
            padding: "12px 14px", maxHeight: 120, overflowY: "auto",
            fontSize: 13, lineHeight: 1.6, color: "#333",
          }}>
            {transcript || (
              <span style={{ color: "#bbb", fontStyle: "italic" }}>
                {isListening ? "Start speaking..." : "No transcript recorded"}
              </span>
            )}
          </div>
          {/* Filler word breakdown */}
          {metrics.fillerCount > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Object.entries(metrics.fillerWords).map(([word, count]) => (
                <span
                  key={word}
                  style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 10,
                    background: "#FFF3E0", color: "#E65100", fontWeight: 500,
                  }}
                >
                  &ldquo;{word}&rdquo; x{count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #eee" }}>
        <button
          onClick={onBack}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd",
            background: "#fff", color: "#666", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          ← Back to Answer
        </button>
        <div style={{ fontSize: 10, color: "#bbb" }}>
          Powered by Web Speech API
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 6px rgba(198,40,40,0.2), 0 0 0 12px rgba(198,40,40,0.1); }
          50% { box-shadow: 0 0 0 10px rgba(198,40,40,0.15), 0 0 0 20px rgba(198,40,40,0.05); }
          100% { box-shadow: 0 0 0 6px rgba(198,40,40,0.2), 0 0 0 12px rgba(198,40,40,0.1); }
        }
      `}</style>
    </div>
  );
}
