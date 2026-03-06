"use client";

/* ============================================================
   BrowserFrame — macOS-style window chrome wrapper
   ============================================================ */
function BrowserFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--paper-dark)",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow:
          "0 4px 24px rgba(26,26,26,0.12), 0 1px 4px rgba(26,26,26,0.08)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: "var(--paper-cream)",
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "1px solid var(--paper-dark)",
          gap: 6,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vermillion)", opacity: 0.7 }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold-accent)", opacity: 0.7 }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--jade-green)", opacity: 0.7 }} />
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 11,
            color: "var(--ink-light)",
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </span>
        {/* Spacer to balance the dots */}
        <span style={{ width: 38 }} />
      </div>

      {/* Content */}
      <div style={{ background: "var(--paper-light)" }}>{children}</div>
    </div>
  );
}

/* ============================================================
   Mockup 1 — Resume Match Rate
   ============================================================ */
function ResumeMatchMockup() {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = 0.73;

  return (
    <div style={{ padding: 16, fontSize: 11, color: "var(--ink-dark)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-black)" }}>Resume Analysis</span>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" rx="1" fill="var(--vermillion)" opacity={0.85} />
          <text x="8" y="11" textAnchor="middle" fontSize="7" fill="var(--paper-white)" fontWeight="bold">印</text>
        </svg>
      </div>

      {/* Score ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--paper-dark)" strokeWidth={5} />
          <circle
            cx={50} cy={50} r={r}
            fill="none"
            stroke="var(--jade-green)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            transform="rotate(-90 50 50)"
          />
          <text
            x={50} y={54}
            textAnchor="middle"
            className="font-cinzel"
            style={{ fontSize: "1.5rem", fontWeight: 700, fill: "var(--ink-black)" }}
          >
            73%
          </text>
        </svg>
      </div>

      {/* Keyword chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "React", match: true },
          { label: "Next.js", match: true },
          { label: "CI/CD", match: false },
          { label: "AWS", match: false },
        ].map((k) => (
          <span
            key={k.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 8px",
              borderRadius: 2,
              fontSize: 10,
              fontWeight: 500,
              background: k.match ? "rgba(45,106,79,0.1)" : "rgba(194,54,22,0.08)",
              color: k.match ? "var(--jade-green)" : "var(--vermillion)",
            }}
          >
            <span style={{ fontSize: 9 }}>{k.match ? "✓" : "✕"}</span>
            {k.label}
          </span>
        ))}
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { text: "Add CI/CD pipeline experience to work history", priority: "critical" as const },
          { text: "Quantify React project outcomes with metrics", priority: "recommended" as const },
          { text: "Align title with 'Senior Frontend Engineer'", priority: "recommended" as const },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 8px",
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderRadius: 2,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background: s.priority === "critical" ? "var(--vermillion)" : "var(--gold-accent)",
              }}
            />
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 11,
              }}
            >
              {s.text}
            </span>
            <button
              style={{
                flexShrink: 0,
                padding: "1px 8px",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--jade-green)",
                background: "rgba(45,106,79,0.08)",
                border: "1px solid rgba(45,106,79,0.2)",
                borderRadius: 2,
                cursor: "default",
              }}
            >
              Accept
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Mockup 2 — Interview Board Kanban
   ============================================================ */
function InterviewBoardMockup() {
  const modules = [
    {
      title: "React Fundamentals",
      color: "var(--ink-black)",
      questions: [
        { text: "Explain the virtual DOM reconciliation", badge: "T" },
        { text: "When would you use useRef vs useState?", badge: "B" },
      ],
    },
    {
      title: "System Design",
      color: "var(--vermillion)",
      questions: [
        { text: "Design a real-time collaborative editor", badge: "T" },
        { text: "How would you scale a notification system?", badge: "C" },
      ],
    },
    {
      title: "Behavioral",
      color: "var(--jade-green)",
      questions: [
        { text: "Describe a time you resolved a team conflict", badge: "B" },
        { text: "How do you prioritize competing deadlines?", badge: "B" },
      ],
    },
  ];

  return (
    <div style={{ padding: 16, fontSize: 11, color: "var(--ink-dark)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="font-cinzel" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-black)" }}>
          Temu — Senior Frontend Engineer
        </span>
        <span
          style={{
            fontSize: 9,
            padding: "1px 6px",
            borderRadius: 2,
            background: "rgba(194,54,22,0.08)",
            color: "var(--vermillion)",
            fontWeight: 600,
          }}
        >
          Technical Round
        </span>
      </div>

      {/* Module cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {modules.map((m) => (
          <div
            key={m.title}
            style={{
              background: "var(--paper-white)",
              border: "1px solid var(--paper-dark)",
              borderLeft: `2px solid ${m.color}`,
              borderRadius: 2,
              padding: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-black)", marginBottom: 6 }}>
              {m.title}
            </div>
            {m.questions.map((q, qi) => (
              <div
                key={qi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "var(--ink-mid)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: qi < m.questions.length - 1 ? 4 : 0,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 14,
                    height: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 700,
                    borderRadius: 2,
                    background: "var(--paper-cream)",
                    border: "1px solid var(--paper-dark)",
                    color: "var(--ink-light)",
                  }}
                >
                  {q.badge}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {q.text}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ height: 4, borderRadius: 2, background: "var(--paper-dark)", overflow: "hidden" }}>
          <div style={{ width: "60%", height: "100%", background: "var(--jade-green)", borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ fontSize: 10, color: "var(--ink-light)", textAlign: "right" }}>24 / 40 questions</div>
    </div>
  );
}

/* ============================================================
   Mockup 3 — Speech Analytics Dashboard
   ============================================================ */
function SpeechAnalyticsMockup() {
  return (
    <div style={{ padding: 16, fontSize: 11, color: "var(--ink-dark)" }}>
      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-black)", marginBottom: 14 }}>
        Speech Analytics
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
        {/* WPM */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span className="font-cinzel" style={{ fontSize: 28, fontWeight: 700, color: "var(--jade-green)", lineHeight: 1 }}>
            142
          </span>
          <div style={{ fontSize: 10, color: "var(--ink-mid)", marginTop: 2 }}>WPM</div>
          <span
            style={{
              display: "inline-block",
              marginTop: 4,
              fontSize: 9,
              padding: "1px 6px",
              borderRadius: 2,
              background: "rgba(45,106,79,0.1)",
              color: "var(--jade-green)",
              fontWeight: 600,
            }}
          >
            Ideal pace
          </span>
        </div>

        {/* Filler words */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span className="font-cinzel" style={{ fontSize: 28, fontWeight: 700, color: "var(--jade-green)", lineHeight: 1 }}>
            2
          </span>
          <div style={{ fontSize: 10, color: "var(--ink-mid)", marginTop: 2 }}>Filler Words</div>
          <span
            style={{
              display: "inline-block",
              marginTop: 4,
              fontSize: 9,
              padding: "1px 6px",
              borderRadius: 2,
              background: "rgba(45,106,79,0.1)",
              color: "var(--jade-green)",
              fontWeight: 600,
            }}
          >
            Excellent
          </span>
        </div>
      </div>

      {/* Mini area chart */}
      <div style={{ marginBottom: 14 }}>
        <svg width="100%" height={60} viewBox="0 0 200 60" preserveAspectRatio="none">
          {/* Ideal range band */}
          <rect x={0} y={10} width={200} height={30} fill="var(--jade-green)" opacity={0.05} />
          <line x1={0} y1={10} x2={200} y2={10} stroke="var(--jade-green)" strokeWidth={0.5} opacity={0.2} strokeDasharray="3 3" />
          <line x1={0} y1={40} x2={200} y2={40} stroke="var(--jade-green)" strokeWidth={0.5} opacity={0.2} strokeDasharray="3 3" />
          {/* Area fill */}
          <path
            d="M0,40 C30,35 60,25 90,30 C120,35 150,20 180,28 L200,24 L200,60 L0,60 Z"
            fill="var(--jade-green)"
            opacity={0.1}
          />
          {/* Line stroke */}
          <path
            d="M0,40 C30,35 60,25 90,30 C120,35 150,20 180,28 L200,24"
            fill="none"
            stroke="var(--jade-green)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-faint)", marginTop: 2 }}>
          <span>0:00</span>
          <span style={{ fontSize: 9, color: "var(--ink-light)" }}>WPM over time</span>
          <span>2:30</span>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
          <span style={{ color: "var(--ink-dark)", fontWeight: 500 }}>Confidence</span>
          <span style={{ color: "var(--gold-accent)", fontWeight: 600 }}>78%</span>
        </div>
        <div style={{ height: 6, borderRadius: 2, background: "var(--paper-dark)", overflow: "hidden" }}>
          <div style={{ width: "78%", height: "100%", background: "var(--gold-accent)", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Main Export — Product Mockups Grid
   ============================================================ */
export default function ProductMockups() {
  const mockups = [
    { title: "resume-match.app", content: <ResumeMatchMockup />, desc: "Instant match scoring with skill gap identification" },
    { title: "interview-board.app", content: <InterviewBoardMockup />, desc: "40-80 questions organized by topic with detailed answers" },
    { title: "speech-analytics.app", content: <SpeechAnalyticsMockup />, desc: "Real-time WPM, filler detection, and confidence scoring" },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {mockups.map((m) => (
        <div key={m.title}>
          <BrowserFrame title={m.title}>{m.content}</BrowserFrame>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mid)",
              textAlign: "center",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            {m.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
