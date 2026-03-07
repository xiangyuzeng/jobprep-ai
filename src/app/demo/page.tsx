"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useSpeechAnalytics, type ConfidenceBreakdown } from "@/hooks/useSpeechAnalytics";
import { ProgressLoader } from "@/components/ui/ProgressLoader";
import { ErrorState } from "@/components/ui/ErrorState";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAMPLE_JD = `Software Engineer - Full Stack

About the Role:
We're looking for a Full Stack Software Engineer to join our team. You'll build and maintain web applications using modern technologies, collaborate with cross-functional teams, and contribute to our engineering culture.

Requirements:
- 3+ years of experience with React, TypeScript, and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Strong understanding of RESTful APIs and database design
- Experience with CI/CD pipelines and agile methodologies
- Excellent problem-solving skills and attention to detail

Nice to Have:
- Experience with Next.js or similar frameworks
- Knowledge of microservices architecture
- Experience with PostgreSQL or similar databases
- Contributions to open source projects`;

const PRACTICE_QUESTIONS = [
  {
    type: "Behavioral",
    question: "Tell me about a time you had to deal with a significant technical challenge on a project. How did you approach it?",
    icon: "B",
    color: "#c9a84c",
  },
  {
    type: "Technical",
    question: "How would you design a real-time notification system that needs to handle millions of concurrent users?",
    icon: "T",
    color: "#2d6a4f",
  },
  {
    type: "Case Study",
    question: "Our checkout conversion rate dropped 15% last month. How would you investigate and address this?",
    icon: "C",
    color: "#c23616",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JDAnalysis {
  job_title?: string;
  company?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  keywords?: string[];
  experience_years?: string;
  key_responsibilities?: string[];
  interview_questions?: { type: string; question: string }[];
}

interface ScoreResult {
  relevance: number | null;
  specificity: number | null;
  structure: number | null;
  contentQuality: number | null;
  feedback: string;
  improvedAnswer: string | null;
  followUp: string | null;
  timedOut?: boolean;
  limitReached?: boolean;
}

type AnalyzeState = "idle" | "analyzing" | "done" | "error";
type PracticeState = "idle" | "selected" | "recording" | "scoring" | "feedback";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number | null): string {
  if (score === null) return "#888";
  if (score >= 70) return "#2d6a4f";
  if (score >= 50) return "#c9a84c";
  return "#c23616";
}

const CONFIDENCE_LABELS: Record<keyof ConfidenceBreakdown, string> = {
  recognition: "Speech Clarity",
  fillerPenalty: "Filler-Free",
  pace: "Pacing",
  consistency: "Consistency",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"analyze" | "practice">("analyze");

  // --- Analyze tab state ---
  const [jdText, setJdText] = useState(SAMPLE_JD);
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>("idle");
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // --- Practice tab state ---
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showImprovedAnswer, setShowImprovedAnswer] = useState(false);
  const speech = useSpeechAnalytics();

  // ------- Analyze tab handlers -------

  const handleAnalyze = async () => {
    setAnalyzeState("analyzing");
    setAnalyzeError("");
    setAnalysis(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/demo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jdText }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.limitReached) {
          setAnalyzeError("Demo limit reached. Sign up for unlimited access!");
        } else {
          setAnalyzeError(data.error || "Analysis failed");
        }
        setAnalyzeState("error");
        return;
      }

      // Parse SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) accumulated += parsed.text;
          } catch {
            // skip
          }
        }
      }

      // Parse JSON from accumulated text
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
        setAnalyzeState("done");
      } else {
        throw new Error("Could not parse analysis results");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
      setAnalyzeState("error");
    }
  };

  // ------- Practice tab handlers -------

  const handleSelectQuestion = (index: number) => {
    setSelectedQuestion(index);
    setPracticeState("selected");
    setScoreResult(null);
    setShowImprovedAnswer(false);
    speech.reset();
  };

  const handleStartRecording = () => {
    speech.reset();
    speech.start();
    setPracticeState("recording");
  };

  const handleStopAndScore = async () => {
    speech.stop();
    setPracticeState("scoring");

    const q = PRACTICE_QUESTIONS[selectedQuestion!];

    try {
      const res = await fetch("/api/demo/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: q.question,
          questionType: q.icon,
          transcript: speech.transcript,
          duration: speech.metrics.duration,
          wpm: speech.metrics.wpm,
          fillerCount: speech.metrics.fillerCount,
          confidenceScore: speech.metrics.confidenceScore,
        }),
      });

      const data = await res.json();
      if (data.limitReached) {
        setScoreResult(null);
        setPracticeState("feedback");
      } else {
        setScoreResult(data);
        setPracticeState("feedback");
      }
    } catch {
      setPracticeState("feedback");
    }
  };

  // ------- Render: Analyze Tab -------

  const renderAnalyzeTab = () => (
    <div>
      {/* JD Input */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e0d0", padding: 20, marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 8 }}>
          Job Description
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          disabled={analyzeState === "analyzing"}
          placeholder="Paste a job description here..."
          style={{
            width: "100%", height: 200, padding: 12, fontSize: 13,
            border: "1px solid #d4c9b5", borderRadius: 6, resize: "none",
            background: analyzeState === "analyzing" ? "#f5f0e8" : "#fff",
            color: "#333", lineHeight: 1.6, outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "#bbb" }}>{jdText.length} characters</span>
          <button
            onClick={handleAnalyze}
            disabled={analyzeState === "analyzing" || jdText.trim().length < 50}
            style={{
              padding: "10px 28px", borderRadius: 8, border: "none",
              background: analyzeState === "analyzing" ? "#d4c9b5" : "#c9a84c",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              opacity: jdText.trim().length < 50 ? 0.5 : 1,
            }}
          >
            {analyzeState === "analyzing" ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {analyzeState === "analyzing" && (
        <ProgressLoader
          steps={["Parsing job requirements...", "Extracting key skills...", "Generating interview questions..."]}
          estimatedSeconds={8}
        />
      )}

      {/* Error */}
      {analyzeState === "error" && (
        <ErrorState
          message={analyzeError}
          onRetry={() => { setAnalyzeState("idle"); setAnalyzeError(""); }}
        />
      )}

      {/* Results */}
      {analyzeState === "done" && analysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Job Info */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e0d0", padding: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
              {analysis.job_title || "Position Analysis"}
            </h3>
            {analysis.company && (
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>{analysis.company}</p>
            )}

            {analysis.required_skills && analysis.required_skills.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 6 }}>
                  Required Skills
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.required_skills.map((skill, i) => (
                    <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#f0f4f8", color: "#2d6a4f", fontWeight: 500 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.preferred_skills && analysis.preferred_skills.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 6 }}>
                  Nice-to-Have Skills
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.preferred_skills.map((skill, i) => (
                    <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#faf7f0", color: "#c9a84c", fontWeight: 500 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interview Questions */}
          {analysis.interview_questions && analysis.interview_questions.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e0d0", padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
                Sample Interview Questions
              </div>
              {analysis.interview_questions.slice(0, 5).map((q, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < 4 ? "1px solid #f0ebe0" : "none" }}>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 4, marginRight: 8,
                    background: q.type?.toLowerCase().includes("behav") ? "#fdf6e3" : q.type?.toLowerCase().includes("tech") ? "#e8f5e9" : "#f0f4f8",
                    color: q.type?.toLowerCase().includes("behav") ? "#c9a84c" : q.type?.toLowerCase().includes("tech") ? "#2d6a4f" : "#666",
                    fontWeight: 600,
                  }}>
                    {q.type}
                  </span>
                  <span style={{ fontSize: 13, color: "#333" }}>{q.question}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {renderSignupCTA("Get your full 40-80 question interview board with AI-generated answers.")}
        </div>
      )}
    </div>
  );

  // ------- Render: Practice Tab -------

  const renderPracticeTab = () => (
    <div>
      {/* Question selection */}
      {(practiceState === "idle" || practiceState === "selected") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>
            Pick a question to practice
          </div>
          {PRACTICE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSelectQuestion(i)}
              style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 8,
                border: selectedQuestion === i ? `2px solid ${q.color}` : "1px solid #e8e0d0",
                background: selectedQuestion === i ? "#fff" : "#faf7f0",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4,
                  background: q.color + "18", color: q.color, fontWeight: 700,
                }}>
                  {q.icon}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: q.color }}>{q.type}</span>
              </div>
              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{q.question}</div>
            </button>
          ))}
        </div>
      )}

      {/* Recording UI */}
      {selectedQuestion !== null && practiceState === "selected" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          {speech.isSupported ? (
            <button
              onClick={handleStartRecording}
              style={{
                width: 80, height: 80, borderRadius: "50%", border: "none",
                background: "#faf7f0", color: "#888", fontSize: 28, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              🎤
            </button>
          ) : (
            <p style={{ fontSize: 13, color: "#888" }}>
              Speech recognition requires Chrome or Edge.
            </p>
          )}
          <div style={{ marginTop: 10, fontSize: 13, color: "#888" }}>
            Click the mic to start answering
          </div>
        </div>
      )}

      {practiceState === "recording" && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button
            onClick={handleStopAndScore}
            style={{
              width: 80, height: 80, borderRadius: "50%", border: "none",
              background: "#c23616", color: "#fff", fontSize: 28, cursor: "pointer",
              boxShadow: "0 0 0 6px rgba(194,54,22,0.2), 0 0 0 12px rgba(194,54,22,0.1)",
              animation: "pulse 2s infinite",
            }}
          >
            🎤
          </button>
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#c23616" }}>
            Listening... Click to stop
          </div>
          <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
            {Math.floor(speech.metrics.duration / 60)}:{(speech.metrics.duration % 60).toString().padStart(2, "0")}
          </div>

          {/* Live metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16, textAlign: "center" }}>
            <div style={{ padding: 10, borderRadius: 8, background: "#f5f0e8" }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{speech.metrics.wpm}</div>
              <div style={{ fontSize: 10, color: "#888" }}>WPM</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f5f0e8" }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{speech.metrics.fillerCount}</div>
              <div style={{ fontSize: 10, color: "#888" }}>Fillers</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f5f0e8" }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{speech.metrics.confidenceScore}%</div>
              <div style={{ fontSize: 10, color: "#888" }}>Confidence</div>
            </div>
          </div>

          {/* Transcript */}
          {speech.transcript && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 8, background: "#faf7f0",
              border: "1px solid #e8e0d0", textAlign: "left", fontSize: 13,
              lineHeight: 1.6, color: "#333", maxHeight: 100, overflowY: "auto",
            }}>
              {speech.transcript}
            </div>
          )}

          <button
            onClick={handleStopAndScore}
            style={{
              marginTop: 16, padding: "10px 28px", borderRadius: 10, border: "none",
              background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Done Answering
          </button>
        </div>
      )}

      {/* Scoring */}
      {practiceState === "scoring" && (
        <ProgressLoader
          steps={["Analyzing your answer...", "Scoring across 4 dimensions...", "Generating coaching feedback..."]}
          estimatedSeconds={5}
        />
      )}

      {/* Feedback */}
      {practiceState === "feedback" && (
        <div>
          {scoreResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Overall score */}
              {(() => {
                const dims = [scoreResult.relevance, scoreResult.specificity, scoreResult.structure, scoreResult.contentQuality].filter((v): v is number => v !== null);
                const overall = dims.length > 0 ? Math.round(dims.reduce((a, b) => a + b, 0) / dims.length) : 0;
                return (
                  <div style={{ textAlign: "center", padding: 16, borderRadius: 12, background: "#f5f0e8", border: "1px solid #d4c9b5" }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(overall), fontFamily: "'JetBrains Mono', monospace" }}>{overall}</div>
                    <div style={{ fontSize: 11, color: scoreColor(overall), fontWeight: 600 }}>
                      {overall >= 80 ? "Excellent" : overall >= 70 ? "Good" : overall >= 50 ? "Needs Improvement" : "Keep Practicing"}
                    </div>
                  </div>
                );
              })()}

              {/* Dimension bars */}
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "#faf7f0", border: "1px solid #d4c9b5" }}>
                {[
                  { label: "Relevance", value: scoreResult.relevance },
                  { label: "Specificity", value: scoreResult.specificity },
                  { label: "Structure", value: scoreResult.structure },
                  { label: "Content Quality", value: scoreResult.contentQuality },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#444" }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(value), fontFamily: "'JetBrains Mono', monospace" }}>{value ?? "--"}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#e8e0d0", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${value ?? 0}%`, background: scoreColor(value), transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Confidence breakdown */}
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "#faf7f0", border: "1px solid #d4c9b5" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>Delivery Breakdown</div>
                {(Object.entries(speech.metrics.confidenceBreakdown) as [keyof ConfidenceBreakdown, number][]).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: "#444" }}>{CONFIDENCE_LABELS[key]}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(value), fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "#e8e0d0", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${value}%`, background: scoreColor(value) }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Feedback */}
              {scoreResult.feedback && (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: "#f0f4f8", border: "1px solid #c8d6e5" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 6 }}>AI Coaching</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "#333" }}>{scoreResult.feedback}</div>
                </div>
              )}

              {/* Improved answer */}
              {scoreResult.improvedAnswer && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d4c9b5", background: "#faf7f0" }}>
                  <button
                    onClick={() => setShowImprovedAnswer(!showImprovedAnswer)}
                    style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>Improved Answer</span>
                    <span style={{ fontSize: 12, color: "#888" }}>{showImprovedAnswer ? "Hide" : "Show"}</span>
                  </button>
                  {showImprovedAnswer && (
                    <div style={{ padding: "0 14px 12px", fontSize: 13, lineHeight: 1.6, color: "#333", borderTop: "1px solid #e8e0d0", paddingTop: 10 }}>
                      {scoreResult.improvedAnswer}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button
                  onClick={() => { setPracticeState("selected"); setScoreResult(null); speech.reset(); }}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #d4c9b5", background: "#f5f0e8", color: "#444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  🎤 Try Again
                </button>
                <button
                  onClick={() => { setPracticeState("idle"); setSelectedQuestion(null); setScoreResult(null); speech.reset(); }}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #d4c9b5", background: "#f5f0e8", color: "#444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Pick Another
                </button>
              </div>

              {renderSignupCTA("Practice with YOUR resume's tailored questions and track improvement over time.")}
            </div>
          ) : (
            <div>
              <ErrorState
                message="Scoring unavailable. Demo limit may have been reached."
                onRetry={() => { setPracticeState("selected"); speech.reset(); }}
              />
              {renderSignupCTA("Sign up for unlimited AI-powered practice sessions.")}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ------- CTA Card -------

  const renderSignupCTA = (message: string) => (
    <div style={{
      marginTop: 20, padding: "20px 24px", borderRadius: 12,
      background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
      color: "#fff", textAlign: "center",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
        Unlock the Full Experience
      </div>
      <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5, margin: "0 0 16px" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/auth/signup"
          style={{
            padding: "10px 28px", borderRadius: 8, background: "#c23616",
            color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}
        >
          Sign Up Free
        </Link>
        <button
          onClick={() => setActiveTab(activeTab === "analyze" ? "practice" : "analyze")}
          style={{
            padding: "10px 20px", borderRadius: 8, background: "transparent",
            border: "1px solid #555", color: "#ccc", fontSize: 13, cursor: "pointer",
          }}
        >
          Try {activeTab === "analyze" ? "Practice Mode" : "JD Analysis"} →
        </button>
      </div>
    </div>
  );

  // ------- Main Render -------

  return (
    <div>
      <h1
        className="font-cinzel"
        style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}
      >
        Try JobPrep AI
      </h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>
        Experience real AI-powered interview prep — no account needed.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e8e0d0" }}>
        <button
          onClick={() => setActiveTab("analyze")}
          style={{
            padding: "10px 20px", border: "none", background: "transparent",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            color: activeTab === "analyze" ? "#1a1a1a" : "#888",
            borderBottom: activeTab === "analyze" ? "2px solid #c9a84c" : "2px solid transparent",
            marginBottom: -2,
          }}
        >
          Scan a Job Description
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          style={{
            padding: "10px 20px", border: "none", background: "transparent",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            color: activeTab === "practice" ? "#1a1a1a" : "#888",
            borderBottom: activeTab === "practice" ? "2px solid #c9a84c" : "2px solid transparent",
            marginBottom: -2,
          }}
        >
          Practice a Question
        </button>
      </div>

      {activeTab === "analyze" ? renderAnalyzeTab() : renderPracticeTab()}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 6px rgba(194,54,22,0.2), 0 0 0 12px rgba(194,54,22,0.1); }
          50% { box-shadow: 0 0 0 10px rgba(194,54,22,0.15), 0 0 0 20px rgba(194,54,22,0.05); }
          100% { box-shadow: 0 0 0 6px rgba(194,54,22,0.2), 0 0 0 12px rgba(194,54,22,0.1); }
        }
      `}</style>
    </div>
  );
}
