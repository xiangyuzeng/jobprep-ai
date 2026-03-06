"use client";

import type { SimulatorQuestion, AnswerRecord } from "@/hooks/useInterviewSimulator";

interface Props {
  questions: SimulatorQuestion[];
  currentIndex: number;
  answers: AnswerRecord[];
}

function scoreColor(answer: AnswerRecord | undefined): string {
  if (!answer || !answer.score || answer.score.relevance === null) return "#ccc";
  const avg =
    ((answer.score.relevance || 0) +
      (answer.score.specificity || 0) +
      (answer.score.structure || 0) +
      (answer.score.contentQuality || 0)) /
    4;
  if (avg >= 70) return "#2d6a4f";
  if (avg >= 50) return "#c9a84c";
  return "#c23616";
}

export default function SimulatorQuestionQueue({
  questions,
  currentIndex,
  answers,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        padding: "8px 16px",
        overflowX: "auto",
        borderBottom: "1px solid var(--paper-dark)",
        background: "var(--paper-cream)",
      }}
    >
      {questions.map((_, i) => {
        const answer = answers[i];
        const isCurrent = i === currentIndex;
        const color = i < answers.length ? scoreColor(answer) : "#ccc";

        return (
          <div
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              color: i < answers.length ? "#fff" : "var(--ink-light)",
              background: i < answers.length ? color : "transparent",
              border: `2px solid ${isCurrent ? "var(--vermillion)" : color}`,
              flexShrink: 0,
              animation: isCurrent ? "pulse 2s ease-in-out infinite" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {i + 1}
          </div>
        );
      })}
      <span
        style={{
          marginLeft: 8,
          fontSize: 11,
          color: "var(--ink-light)",
          whiteSpace: "nowrap",
        }}
      >
        {answers.length} of {questions.length}
      </span>
    </div>
  );
}
