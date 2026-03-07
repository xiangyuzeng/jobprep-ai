"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Card {
  num: number;
  q: string;
  a: string;
  qtype: string;
  charCount?: number;
  moduleTitle: string;
}

interface Module {
  title: string;
  cards: Array<{ num: number; q: string; a: string; qtype: string; charCount?: number }>;
}

interface Board {
  id: string;
  company_name: string;
  role: string;
  round_type: string;
  modules: Module[];
  total_questions: number;
  qtypes: Record<string, string>;
}

interface FSRSData {
  nextReview: number; // timestamp
  interval: number; // ms
}

// ---------------------------------------------------------------------------
// FSRS helpers
// ---------------------------------------------------------------------------

const DEFAULT_INTERVAL = 86400000; // 1 day in ms
const MIN_INTERVAL = 3600000; // 1 hour in ms

function loadFSRS(boardId: string): Record<number, FSRSData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`study-progress-${boardId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFSRS(boardId: string, data: Record<number, FSRSData>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`study-progress-${boardId}`, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QTYPE_INFO: Record<string, { color: string; bg: string; icon: string; desc: string }> = {
  B: { color: "#1a1a1a", bg: "#ede6d6", icon: "💬", desc: "Behavioral" },
  T: { color: "#c23616", bg: "#fdf2f0", icon: "⚙️", desc: "Technical" },
  P: { color: "#2d6a4f", bg: "#edf5f0", icon: "💡", desc: "Problem" },
  C: { color: "#c9a84c", bg: "#f8f3e6", icon: "🎭", desc: "Case" },
  S: { color: "#555555", bg: "#f0ede7", icon: "🔍", desc: "Scenario" },
  L: { color: "#a02010", bg: "#fdf2f0", icon: "👥", desc: "Leadership" },
};

function qt(t: string) {
  return QTYPE_INFO[t] || { color: "#666", bg: "#f5f5f5", icon: "❓", desc: t };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StudyModePage() {
  const { id: boardId } = useParams<{ id: string }>();
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fsrs, setFsrs] = useState<Record<number, FSRSData>>({});
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());
  const [shuffled, setShuffled] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedQtype, setSelectedQtype] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);

  // Load board data
  useEffect(() => {
    async function fetchBoard() {
      const supabase = createClient();
      const { data } = await supabase
        .from("interview_boards")
        .select("*")
        .eq("id", boardId)
        .single();

      if (data) {
        setBoard(data as Board);
        setFsrs(loadFSRS(boardId));
      }
      setLoading(false);
    }
    fetchBoard();
  }, [boardId]);

  // Flatten and sort cards
  const allCards: Card[] = useMemo(() => {
    if (!board) return [];

    let cards: Card[] = [];
    for (const mod of board.modules) {
      for (const card of mod.cards) {
        if (!card.a) continue; // Skip unanswered cards
        cards.push({ ...card, moduleTitle: mod.title });
      }
    }

    // Apply filters
    if (selectedModule) {
      cards = cards.filter((c) => c.moduleTitle === selectedModule);
    }
    if (selectedQtype) {
      cards = cards.filter((c) => c.qtype === selectedQtype);
    }

    // Sort by FSRS: due cards first (lowest nextReview timestamp)
    const now = Date.now();
    cards.sort((a, b) => {
      const aReview = fsrs[a.num]?.nextReview ?? 0;
      const bReview = fsrs[b.num]?.nextReview ?? 0;
      return aReview - bReview;
    });

    // Shuffle if enabled (Fisher-Yates)
    if (shuffled) {
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
    }

    return cards;
  }, [board, fsrs, shuffled, selectedModule, selectedQtype]);

  const currentCard = allCards[currentIndex] || null;

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" && currentIndex < allCards.length - 1) {
        e.preventDefault();
        setCurrentIndex((i) => i + 1);
        setShowAnswer(false);
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex((i) => i - 1);
        setShowAnswer(false);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setShowAnswer((s) => !s);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, allCards.length]);

  // Grade card
  const gradeCard = useCallback(
    (grade: "got_it" | "needs_work" | "missed") => {
      if (!currentCard || !board) return;

      const now = Date.now();
      const current = fsrs[currentCard.num] || { nextReview: 0, interval: DEFAULT_INTERVAL };
      let newInterval: number;

      switch (grade) {
        case "got_it":
          newInterval = current.interval * 2;
          break;
        case "needs_work":
          newInterval = current.interval;
          break;
        case "missed":
          newInterval = MIN_INTERVAL;
          break;
      }

      const updated = {
        ...fsrs,
        [currentCard.num]: {
          nextReview: now + newInterval,
          interval: newInterval,
        },
      };

      setFsrs(updated);
      saveFSRS(boardId, updated);
      setReviewed((prev) => new Set(prev).add(currentCard.num));

      // Advance to next card
      if (currentIndex < allCards.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowAnswer(false);
      }
    },
    [currentCard, board, fsrs, boardId, currentIndex, allCards.length]
  );

  // Touch handlers for swipe
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
        setShowAnswer(false);
      } else if (diff < 0 && currentIndex < allCards.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowAnswer(false);
      }
    }
  }

  // Loading / error states
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-light)" }}>
        <p style={{ color: "#888", fontSize: 14 }}>Loading study cards...</p>
      </div>
    );
  }

  if (!board || allCards.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--paper-light)", gap: 12 }}>
        <p style={{ color: "#888", fontSize: 14 }}>{board ? "No cards available for study" : "Board not found"}</p>
        <button onClick={() => router.push(`/dashboard/interview/${boardId}`)} style={{ padding: "8px 16px", background: "var(--vermillion)", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Back to Board
        </button>
      </div>
    );
  }

  const qtInfo = qt(currentCard?.qtype || "B");
  const moduleNames = board.modules.map((m) => m.title);
  const qtypeKeys = Object.keys(board.qtypes || {});

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--paper-light)", display: "flex", flexDirection: "column" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={{ padding: "12px 16px", background: "rgba(237,230,214,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => router.push(`/dashboard/interview/${boardId}`)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--vermillion)", fontWeight: 600 }}>
            ← Back
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-dark)" }}>
            📖 Study Mode
          </span>
          <span style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>
            {reviewed.size}/{allCards.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ maxWidth: 600, margin: "8px auto 0", height: 3, background: "#e8e4dc", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${((currentIndex + 1) / allCards.length) * 100}%`, height: "100%", background: "var(--vermillion)", borderRadius: 2, transition: "width 0.3s" }} />
        </div>

        {/* Filters row */}
        <div style={{ maxWidth: 600, margin: "8px auto 0", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* Module filter */}
          <select
            value={selectedModule || ""}
            onChange={(e) => { setSelectedModule(e.target.value || null); setCurrentIndex(0); setShowAnswer(false); }}
            style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #ddd", fontSize: 10, background: "white", color: "#555" }}
          >
            <option value="">All modules</option>
            {moduleNames.map((m) => (
              <option key={m} value={m}>{m.replace(/[^\w\s]/g, "").trim()}</option>
            ))}
          </select>

          {/* QTYPE chips */}
          {qtypeKeys.map((k) => (
            <button
              key={k}
              onClick={() => { setSelectedQtype(selectedQtype === k ? null : k); setCurrentIndex(0); setShowAnswer(false); }}
              style={{
                padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600,
                border: selectedQtype === k ? `1px solid ${qt(k).color}` : "1px solid #e0e0e0",
                background: selectedQtype === k ? qt(k).bg : "#f5f0e8",
                color: selectedQtype === k ? qt(k).color : "#999",
                cursor: "pointer",
              }}
            >
              {qt(k).icon} {k}
            </button>
          ))}

          {/* Shuffle toggle */}
          <button
            onClick={() => { setShuffled(!shuffled); setCurrentIndex(0); setShowAnswer(false); }}
            style={{
              padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600,
              border: shuffled ? "1px solid var(--vermillion)" : "1px solid #e0e0e0",
              background: shuffled ? "rgba(194,54,22,0.08)" : "#f5f0e8",
              color: shuffled ? "var(--vermillion)" : "#999",
              cursor: "pointer", marginLeft: "auto",
            }}
          >
            🔀 Shuffle
          </button>
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
          {/* Card number + qtype badge */}
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'JetBrains Mono', monospace" }}>
              Q{currentCard.num} · {currentIndex + 1}/{allCards.length}
            </span>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: qtInfo.bg, color: qtInfo.color }}>
              {qtInfo.icon} {qtInfo.desc}
            </span>
          </div>

          {/* Question */}
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-black)", lineHeight: 1.5, marginBottom: 24, fontFamily: "'Crimson Pro', serif" }}>
            {currentCard.q}
          </h2>

          {/* Show Answer / Answer */}
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              style={{
                padding: "12px 32px", borderRadius: 8,
                background: "var(--ink-dark)", color: "white",
                border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              Show Answer
            </button>
          ) : (
            <div style={{
              textAlign: "left", padding: "20px 24px",
              background: "white", borderRadius: 12,
              border: "1px solid #e8e4dc",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              animation: "fadeIn 0.3s ease",
            }}>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "#2d2d2d", whiteSpace: "pre-wrap" }}>
                {currentCard.a}
              </div>
            </div>
          )}

          {/* Grading buttons (visible after answer shown) */}
          {showAnswer && (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button
                onClick={() => gradeCard("missed")}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "var(--vermillion)", color: "white", fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                ❌ Missed
              </button>
              <button
                onClick={() => gradeCard("needs_work")}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "var(--gold-accent)", color: "white", fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                🔄 Needs Work
              </button>
              <button
                onClick={() => gradeCard("got_it")}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "var(--jade-green)", color: "white", fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                ✅ Got It
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e8e4dc", background: "rgba(237,230,214,0.92)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setShowAnswer(false); }}
            disabled={currentIndex === 0}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd",
              background: "white", color: currentIndex === 0 ? "#ccc" : "#555",
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 600,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 10, color: "#aaa" }}>
            Use arrow keys or swipe
          </span>
          <button
            onClick={() => { setCurrentIndex((i) => Math.min(allCards.length - 1, i + 1)); setShowAnswer(false); }}
            disabled={currentIndex >= allCards.length - 1}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd",
              background: "white", color: currentIndex >= allCards.length - 1 ? "#ccc" : "#555",
              cursor: currentIndex >= allCards.length - 1 ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 600,
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Inline animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
