"use client";

import { useState } from "react";
import type { AnswerRecord } from "@/hooks/useInterviewSimulator";

interface Props {
  answer: AnswerRecord;
  questionIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onRetry: () => void;
}

function scoreColor(score: number): string {
  if (score >= 70) return "#2d6a4f";
  if (score >= 50) return "#c9a84c";
  return "#c23616";
}

function overallScore(answer: AnswerRecord): number {
  if (!answer.score || answer.score.relevance === null) return 0;
  return Math.round(
    ((answer.score.relevance || 0) +
      (answer.score.specificity || 0) +
      (answer.score.structure || 0) +
      (answer.score.contentQuality || 0)) /
      4
  );
}

export default function SimulatorFeedbackCard({
  answer,
  questionIndex,
  totalQuestions,
  onNext,
  onRetry,
}: Props) {
  const [showImproved, setShowImproved] = useState(false);
  const score = answer.score;
  const overall = overallScore(answer);
  const hasScores = score && score.relevance !== null;

  const dimensions = hasScores
    ? [
        { label: "Relevance", value: score!.relevance! },
        { label: "Specificity", value: score!.specificity! },
        { label: "Structure", value: score!.structure! },
        { label: "Content Quality", value: score!.contentQuality! },
      ]
    : [];

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "24px 20px",
      }}
    >
      {/* Question */}
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-mid)",
          marginBottom: 4,
          fontFamily: "'Crimson Pro', Georgia, serif",
        }}
      >
        Question {questionIndex + 1} of {totalQuestions}
      </p>
      <p
        style={{
          fontSize: 16,
          color: "var(--ink-black)",
          fontWeight: 500,
          marginBottom: 20,
          fontFamily: "'Crimson Pro', Georgia, serif",
          lineHeight: 1.5,
        }}
      >
        {answer.questionText}
      </p>

      {/* Overall score */}
      {hasScores && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `4px solid ${scoreColor(overall)}`,
              background: "var(--paper-white)",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: scoreColor(overall),
              }}
            >
              {overall}
            </span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "var(--ink-light)",
              fontWeight: 600,
            }}
          >
            Overall Score
          </div>
        </div>
      )}

      {/* 4 dimension bars */}
      {dimensions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {dimensions.map((dim) => (
            <div key={dim.label} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "var(--ink-mid)", fontWeight: 500 }}>
                  {dim.label}
                </span>
                <span
                  style={{
                    color: scoreColor(dim.value),
                    fontWeight: 700,
                  }}
                >
                  {dim.value}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "var(--paper-dark)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${dim.value}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: scoreColor(dim.value),
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Feedback */}
      {score?.feedback && (
        <div
          style={{
            padding: "14px 16px",
            background: "#f8f3e6",
            borderLeft: "3px solid var(--vermillion)",
            borderRadius: "0 6px 6px 0",
            marginBottom: 16,
            fontSize: 14,
            color: "var(--ink-black)",
            fontFamily: "'Crimson Pro', Georgia, serif",
            lineHeight: 1.6,
          }}
        >
          {score.feedback}
        </div>
      )}

      {/* Delivery stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          { label: "WPM", value: answer.metrics.wpm },
          { label: "Fillers", value: answer.metrics.fillerCount },
          { label: "Confidence", value: `${answer.metrics.confidenceScore}%` },
          {
            label: "Duration",
            value: `${Math.floor(answer.metrics.duration / 60)}:${String(
              answer.metrics.duration % 60
            ).padStart(2, "0")}`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "8px",
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 6,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-black)" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-light)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Transcript vs improved */}
      {score?.improvedAnswer && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            <button
              onClick={() => setShowImproved(false)}
              className="cursor-pointer"
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid var(--paper-dark)",
                background: !showImproved ? "var(--ink-dark)" : "transparent",
                color: !showImproved ? "#fff" : "var(--ink-mid)",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Your Answer
            </button>
            <button
              onClick={() => setShowImproved(true)}
              className="cursor-pointer"
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid var(--paper-dark)",
                background: showImproved ? "var(--jade-green)" : "transparent",
                color: showImproved ? "#fff" : "var(--ink-mid)",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Improved Version
            </button>
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--ink-black)",
              fontFamily: "'Crimson Pro', Georgia, serif",
              lineHeight: 1.6,
              minHeight: 60,
            }}
          >
            {showImproved ? score.improvedAnswer : answer.transcript || "(Skipped)"}
          </div>
        </div>
      )}

      {/* Follow-up section */}
      {answer.followUp && (
        <div
          style={{
            padding: "14px 16px",
            background: "var(--paper-cream)",
            border: "1px solid var(--paper-dark)",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--gold-accent)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Follow-Up
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-black)",
              fontWeight: 500,
              marginBottom: 8,
              fontFamily: "'Crimson Pro', Georgia, serif",
            }}
          >
            {answer.followUp.question}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mid)",
              fontFamily: "'Crimson Pro', Georgia, serif",
              lineHeight: 1.5,
            }}
          >
            {answer.followUp.transcript || "(No response)"}
          </p>
          {answer.followUp.score && answer.followUp.score.feedback && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "#f8f3e6",
                borderRadius: 4,
                fontSize: 12,
                color: "var(--ink-black)",
                fontFamily: "'Crimson Pro', Georgia, serif",
              }}
            >
              {answer.followUp.score.feedback}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          paddingTop: 8,
        }}
      >
        <button
          onClick={onNext}
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
          {questionIndex + 1 >= totalQuestions
            ? "View Results"
            : "Next Question"}
        </button>
        <button
          onClick={onRetry}
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
          Try Again
        </button>
      </div>
    </div>
  );
}
