"use client";

import type { CoachMode } from "@/types/coach";

interface ModeTile {
  mode: CoachMode;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

const MODES: ModeTile[] = [
  {
    mode: "general",
    title: "Career Coach",
    description: "Career strategy, job search advice, salary negotiation",
    icon: "\u{1F3AF}",
    accentColor: "var(--gold-accent)",
  },
  {
    mode: "mock_interviewer",
    title: "Mock Interviewer",
    description: "Practice with a realistic hiring manager simulation",
    icon: "\u{1F3A4}",
    accentColor: "var(--vermillion)",
  },
  {
    mode: "resume_coach",
    title: "Resume Coach",
    description: "ATS optimization, bullet rewrites, skill gap analysis",
    icon: "\u{1F4DD}",
    accentColor: "var(--jade-green)",
  },
  {
    mode: "answer_improver",
    title: "Answer Improver",
    description: "STAR method coaching, specificity, conciseness",
    icon: "\u{2728}",
    accentColor: "var(--ink-dark)",
  },
];

interface Props {
  onSelectMode: (mode: CoachMode) => void;
}

export default function CoachModeSelector({ onSelectMode }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h2
        className="font-cinzel text-2xl sm:text-3xl font-bold mb-2"
        style={{ color: "var(--ink-black)" }}
      >
        AI Interview Coach
      </h2>
      <p className="text-sm mb-8" style={{ color: "var(--ink-mid)" }}>
        Choose a coaching mode to get started
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {MODES.map((m) => (
          <button
            key={m.mode}
            onClick={() => onSelectMode(m.mode)}
            className="text-left bg-white rounded-sm p-5 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
            style={{
              borderLeftWidth: 3,
              borderLeftColor: m.accentColor,
            }}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <h3
              className="font-cinzel text-base font-semibold mb-1"
              style={{ color: "var(--ink-black)" }}
            >
              {m.title}
            </h3>
            <p className="text-xs" style={{ color: "var(--ink-mid)" }}>
              {m.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
