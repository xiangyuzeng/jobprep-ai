"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Hardcoded demo data
// ---------------------------------------------------------------------------

const SAMPLE_JD = `Senior Frontend Engineer — Temu
Requirements:
- 5+ years React/TypeScript experience
- Experience with Next.js and server-side rendering
- Strong understanding of state management (Redux, Zustand)
- Experience with CI/CD pipelines
- Familiarity with cloud services (AWS/GCP)
- Excellent problem-solving and communication skills`;

const DEMO_RESULT = {
  matchRate: 73,
  skillGaps: [
    { skill: "CI/CD Pipeline Experience", priority: "critical" as const, status: "missing" as const },
    { skill: "Cloud Services (AWS/GCP)", priority: "critical" as const, status: "missing" as const },
    { skill: "Redux/Zustand State Management", priority: "critical" as const, status: "strengthen" as const },
    { skill: "Next.js SSR", priority: "recommended" as const, status: "matched" as const },
    { skill: "React/TypeScript (5+ years)", priority: "recommended" as const, status: "matched" as const },
    { skill: "Problem-Solving Skills", priority: "optional" as const, status: "matched" as const },
  ],
  questions: [
    { type: "B", question: "Describe a time you improved a CI/CD pipeline. What was the impact on deployment frequency?" },
    { type: "T", question: "How would you implement server-side rendering with Next.js for a product page with dynamic pricing?" },
    { type: "C", question: "Temu's app serves 200M+ users. How would you architect the frontend to handle flash sale traffic spikes?" },
  ],
};

const STATUS_MESSAGES = [
  "Parsing job requirements...",
  "Analyzing skill alignment...",
  "Generating interview questions...",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = "idle" | "analyzing" | "match-rate" | "skill-gaps" | "questions" | "complete";
type Priority = "critical" | "recommended" | "optional";
type Status = "missing" | "strengthen" | "matched";

// ---------------------------------------------------------------------------
// Sub-component: DemoCircularProgress
// ---------------------------------------------------------------------------

function DemoCircularProgress({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const DURATION = 1200; // ms
  const SIZE = 100;
  const RADIUS = 44;
  const STROKE_WIDTH = 5;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * target);
      setValue(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target]);

  const progressColor =
    value >= 80
      ? "var(--jade-green)"
      : value >= 60
        ? "var(--gold-accent)"
        : "var(--vermillion)";

  const dashOffset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--paper-dark)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={progressColor}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
      </svg>
      <div
        className="font-cinzel"
        style={{
          position: "relative",
          marginTop: -68,
          fontSize: 24,
          fontWeight: 700,
          color: progressColor,
          textAlign: "center",
          lineHeight: "36px",
        }}
      >
        {value}%
      </div>
      <p
        className="text-xs mt-4"
        style={{ color: "var(--ink-light)" }}
      >
        Match Rate
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: DemoSkillItem
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<Priority, { bg: string; color: string }> = {
  critical: { bg: "#fdf2f0", color: "var(--vermillion)" },
  recommended: { bg: "#f8f3e6", color: "var(--gold-accent)" },
  optional: { bg: "var(--paper-cream)", color: "var(--ink-light)" },
};

const STATUS_ICONS: Record<Status, { icon: string; color: string }> = {
  missing: { icon: "\u2715", color: "var(--vermillion)" },
  strengthen: { icon: "\u26A0", color: "var(--gold-accent)" },
  matched: { icon: "\u2713", color: "var(--jade-green)" },
};

function DemoSkillItem({
  skill,
  priority,
  status,
  delay,
  visible,
}: {
  skill: string;
  priority: Priority;
  status: Status;
  delay: number;
  visible: boolean;
}) {
  const pStyle = PRIORITY_STYLES[priority];
  const sStyle = STATUS_ICONS[status];

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms`,
        borderRadius: 2,
        backgroundColor: "var(--paper-white)",
        border: "1px solid var(--paper-dark)",
      }}
    >
      <span
        style={{
          color: sStyle.color,
          fontSize: 14,
          fontWeight: 700,
          width: 20,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {sStyle.icon}
      </span>
      <span
        className="text-sm flex-1"
        style={{ color: "var(--ink-dark)" }}
      >
        {skill}
      </span>
      <span
        className="text-xs px-2 py-0.5"
        style={{
          backgroundColor: pStyle.bg,
          color: pStyle.color,
          borderRadius: 2,
          fontWeight: 600,
          textTransform: "capitalize",
          flexShrink: 0,
        }}
      >
        {priority}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: DemoQuestionCard
// ---------------------------------------------------------------------------

const QUESTION_TYPE_CONFIG: Record<string, { label: string; borderColor: string; badgeBg: string; badgeText: string }> = {
  B: { label: "Behavioral", borderColor: "#1a1a1a", badgeBg: "#ede6d6", badgeText: "#1a1a1a" },
  T: { label: "Technical", borderColor: "#c23616", badgeBg: "#fdf2f0", badgeText: "#c23616" },
  C: { label: "Case", borderColor: "#c9a84c", badgeBg: "#f8f3e6", badgeText: "#c9a84c" },
};

function DemoQuestionCard({
  type,
  question,
  delay,
  visible,
}: {
  type: string;
  question: string;
  delay: number;
  visible: boolean;
}) {
  const config = QUESTION_TYPE_CONFIG[type] ?? QUESTION_TYPE_CONFIG.B;

  return (
    <div
      className="p-3"
      style={{
        backgroundColor: "var(--paper-white)",
        border: "1px solid var(--paper-dark)",
        borderLeft: `2px solid ${config.borderColor}`,
        borderRadius: 2,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      <span
        className="text-xs px-2 py-0.5 inline-block mb-2"
        style={{
          backgroundColor: config.badgeBg,
          color: config.badgeText,
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        {config.label}
      </span>
      <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dark)", margin: 0 }}>
        {question}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analyzing progress bar (brush-stroke SVG)
// ---------------------------------------------------------------------------

function AnalyzingProgress({ progress }: { progress: number }) {
  // Brush-stroke style path for the progress bar
  const pathD =
    "M 4 12 Q 20 6, 60 12 T 120 10 T 180 12 T 240 10 T 296 12";

  return (
    <svg
      width="100%"
      height={24}
      viewBox="0 0 300 24"
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--paper-dark)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke="var(--ink-dark)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={450}
        strokeDashoffset={450 - progress * 450}
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component: LiveDemo
// ---------------------------------------------------------------------------

export default function LiveDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [jdText, setJdText] = useState(SAMPLE_JD);
  const [statusIndex, setStatusIndex] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [skillsVisible, setSkillsVisible] = useState<boolean[]>(
    new Array(DEMO_RESULT.skillGaps.length).fill(false)
  );
  const [questionsVisible, setQuestionsVisible] = useState<boolean[]>(
    new Array(DEMO_RESULT.questions.length).fill(false)
  );
  const [ctaVisible, setCtaVisible] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // ---------------------------------------------------------------------------
  // Phase orchestrator
  // ---------------------------------------------------------------------------

  const handleAnalyze = useCallback(() => {
    if (!jdText.trim()) return;

    // Reset all state
    clearTimers();
    setSkillsVisible(new Array(DEMO_RESULT.skillGaps.length).fill(false));
    setQuestionsVisible(new Array(DEMO_RESULT.questions.length).fill(false));
    setCtaVisible(false);
    setStatusIndex(0);
    setAnalyzeProgress(0);

    // Phase 1: Analyzing
    setPhase("analyzing");

    // Progress ticks
    addTimer(() => setAnalyzeProgress(0.35), 200);
    addTimer(() => setAnalyzeProgress(0.6), 600);
    addTimer(() => setAnalyzeProgress(0.85), 1200);
    addTimer(() => setAnalyzeProgress(1), 1600);

    // Status message cycling
    addTimer(() => setStatusIndex(1), 600);
    addTimer(() => setStatusIndex(2), 1200);

    // Phase 2: match-rate (after 1800ms)
    addTimer(() => {
      setPhase("match-rate");
    }, 1800);

    // Phase 3: skill-gaps (after match-rate animation ~1200ms)
    addTimer(() => {
      setPhase("skill-gaps");

      DEMO_RESULT.skillGaps.forEach((_, i) => {
        addTimer(() => {
          setSkillsVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 100);
      });
    }, 3200);

    // Phase 4: questions (after skills cascade)
    addTimer(() => {
      setPhase("questions");

      DEMO_RESULT.questions.forEach((_, i) => {
        addTimer(() => {
          setQuestionsVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 150);
      });
    }, 4200);

    // Phase 5: complete
    addTimer(() => {
      setPhase("complete");
      addTimer(() => setCtaVisible(true), 200);
    }, 5200);
  }, [jdText, addTimer, clearTimers]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const showResults = phase !== "idle" && phase !== "analyzing";

  return (
    <section className="w-full" style={{ color: "var(--ink-black)" }}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* ---- Left: Textarea + Analyze ---- */}
        <div className="flex flex-col gap-3">
          <label
            htmlFor="demo-jd-input"
            className="font-cinzel text-base font-semibold"
            style={{ color: "var(--ink-dark)" }}
          >
            Paste a job description
          </label>
          <textarea
            id="demo-jd-input"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={10}
            className="w-full text-sm leading-relaxed p-3 resize-none outline-none"
            style={{
              backgroundColor: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              color: "var(--ink-dark)",
              borderRadius: 2,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--vermillion)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(194, 54, 22, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--paper-dark)";
              e.currentTarget.style.boxShadow = "none";
            }}
            disabled={phase !== "idle" && phase !== "complete"}
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={phase !== "idle" && phase !== "complete"}
            className="w-full text-sm font-semibold py-2.5 px-4 transition-colors duration-200"
            style={{
              backgroundColor:
                phase !== "idle" && phase !== "complete"
                  ? "var(--ink-light)"
                  : "var(--vermillion)",
              color: "var(--paper-white)",
              borderRadius: 2,
              border: "none",
              cursor:
                phase !== "idle" && phase !== "complete"
                  ? "not-allowed"
                  : "pointer",
            }}
            onMouseEnter={(e) => {
              if (phase === "idle" || phase === "complete") {
                e.currentTarget.style.backgroundColor = "var(--vermillion-dark)";
              }
            }}
            onMouseLeave={(e) => {
              if (phase === "idle" || phase === "complete") {
                e.currentTarget.style.backgroundColor = "var(--vermillion)";
              }
            }}
          >
            {phase !== "idle" && phase !== "complete" ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* ---- Right: Results Panel ---- */}
        <div
          className="flex flex-col gap-5 p-4"
          style={{
            backgroundColor: "var(--paper-light)",
            border: "1px solid var(--paper-dark)",
            borderRadius: 2,
            minHeight: 300,
          }}
        >
          {/* Idle placeholder */}
          {phase === "idle" && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                Results will appear here
              </p>
            </div>
          )}

          {/* Analyzing */}
          {phase === "analyzing" && (
            <div className="flex flex-col items-center justify-center gap-4 h-full">
              <div className="w-full max-w-xs">
                <AnalyzingProgress progress={analyzeProgress} />
              </div>
              <p
                className="text-sm"
                style={{
                  color: "var(--ink-mid)",
                  minHeight: 20,
                  transition: "opacity 0.25s ease",
                }}
              >
                {STATUS_MESSAGES[statusIndex]}
              </p>
            </div>
          )}

          {/* Match Rate */}
          {showResults && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <DemoCircularProgress target={DEMO_RESULT.matchRate} />
            </div>
          )}

          {/* Skill Gaps */}
          {(phase === "skill-gaps" || phase === "questions" || phase === "complete") && (
            <div className="flex flex-col gap-2">
              <h3
                className="font-cinzel text-sm font-semibold mb-1"
                style={{ color: "var(--ink-dark)" }}
              >
                Skill Gap Analysis
              </h3>
              {DEMO_RESULT.skillGaps.map((item, i) => (
                <DemoSkillItem
                  key={item.skill}
                  skill={item.skill}
                  priority={item.priority}
                  status={item.status}
                  delay={i * 100}
                  visible={skillsVisible[i]}
                />
              ))}
            </div>
          )}

          {/* Questions */}
          {(phase === "questions" || phase === "complete") && (
            <div className="flex flex-col gap-2">
              <h3
                className="font-cinzel text-sm font-semibold mb-1"
                style={{ color: "var(--ink-dark)" }}
              >
                Interview Questions
              </h3>
              {DEMO_RESULT.questions.map((item, i) => (
                <DemoQuestionCard
                  key={item.type}
                  type={item.type}
                  question={item.question}
                  delay={i * 150}
                  visible={questionsVisible[i]}
                />
              ))}
            </div>
          )}

          {/* CTA */}
          {phase === "complete" && (
            <div
              className="flex justify-center pt-2 pb-1"
              style={{
                opacity: ctaVisible ? 1 : 0,
                transition: "opacity 0.5s ease",
              }}
            >
              <Link
                href="/auth/signup"
                className="text-sm font-semibold py-2 px-5 inline-block transition-colors duration-200"
                style={{
                  backgroundColor: "var(--vermillion)",
                  color: "var(--paper-white)",
                  borderRadius: 2,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--vermillion-dark)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--vermillion)";
                }}
              >
                Get your full analysis — it&apos;s free
              </Link>
              <Link
                href="/demo"
                className="text-sm font-medium ml-4 inline-block transition-colors duration-200"
                style={{
                  color: "var(--ink-mid)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ink-dark)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--ink-mid)";
                }}
              >
                Try the real thing &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
