"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const SpeechPracticePanel = dynamic(() => import("@/components/interview/SpeechPracticePanel"), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Card {
  num: number;
  q: string;
  a: string;
  qtype: string;
  charCount?: number;
}

interface Module {
  title: string;
  cards: Card[];
}

interface Board {
  id: string;
  company_name: string;
  role: string;
  round_type: string;
  board_type: string;
  status: string;
  total_questions: number;
  qtypes: Record<string, string>;
  modules: Module[];
  modules_completed: number;
  modules_total: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants — Kanban palette
// ---------------------------------------------------------------------------

const MODULE_COLORS = ["#1a1a1a", "#c23616", "#2d6a4f", "#c9a84c", "#2d2d2d", "#555555", "#a02010", "#40916c", "#888888", "#b89840"];

const MODULE_ICONS = [
  "🧠", "💡", "🛠️", "📊", "🎯", "🔑", "🚀", "🏗️", "📋", "⚙️",
];

const QTYPE_INFO: Record<string, {color:string;bg:string;icon:string;desc:string}> = {
  B: { color: "#1a1a1a", bg: "#ede6d6", icon: "\u{1F4AC}", desc: "Behavioral" },
  T: { color: "#c23616", bg: "#fdf2f0", icon: "\u2699\uFE0F", desc: "Technical" },
  P: { color: "#2d6a4f", bg: "#edf5f0", icon: "\u{1F4A1}", desc: "Problem" },
  C: { color: "#c9a84c", bg: "#f8f3e6", icon: "\u{1F3AD}", desc: "Case" },
  S: { color: "#555555", bg: "#f0ede7", icon: "\u{1F50D}", desc: "Scenario" },
  L: { color: "#a02010", bg: "#fdf2f0", icon: "\u{1F465}", desc: "Leadership" },
};

const ACCENT = "#c23616";

function qt(t: string) {
  return QTYPE_INFO[t] || { color: "#666", bg: "#f5f5f5", icon: "❓", desc: t };
}

// ---------------------------------------------------------------------------
// Smart Answer Renderer (adapted from board-page-template.jsx)
// ---------------------------------------------------------------------------

function renderAnswer(text: string, modColor: string) {
  if (!text) return null;

  return text.split("\n\n").map((para, pi) => (
    <div key={pi} style={{ marginBottom: 10 }}>
      {para.split("\n").map((line, li) => {
        const t = line.trim();
        if (!t) return null;

        // Warning header 【⚠️...】
        if (/^【⚠️/.test(t))
          return (
            <p key={li} style={{ fontSize: 14, fontWeight: 700, color: "#B71C1C", marginTop: 20, marginBottom: 6, borderLeft: "3px solid #E53935", paddingLeft: 10, background: "#f8f3e6", padding: "8px 12px", borderRadius: "0 6px 6px 0" }}>
              {t}
            </p>
          );

        // Regular header 【...】
        if (/^【/.test(t))
          return (
            <p key={li} style={{ fontSize: 14, fontWeight: 700, color: modColor, marginTop: 16, marginBottom: 6, borderLeft: "3px solid " + modColor, paddingLeft: 10 }}>
              {t}
            </p>
          );

        // Phase headers
        if (/^Phase\s/i.test(t))
          return (
            <p key={li} style={{ fontSize: 14, fontWeight: 700, color: modColor, marginTop: 14, marginBottom: 4 }}>
              {t}
            </p>
          );

        // Step/Part headers
        if (/^(Step|Part)\s\d/i.test(t))
          return (
            <p key={li} style={{ fontSize: 14, fontWeight: 700, color: modColor, marginTop: 14, marginBottom: 4 }}>
              {t}
            </p>
          );

        // Bullet points
        if (/^[•·\-–►]/.test(t))
          return (
            <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#2d2d2d", paddingLeft: 14, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: modColor, fontWeight: 700 }}>·</span>
              {t.replace(/^[•·\-–►]\s*/, "")}
            </p>
          );

        // Numbered items
        if (/^[0-9]+[.)]/.test(t))
          return (
            <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#333", fontWeight: 500, marginTop: 4 }}>
              {t}
            </p>
          );

        // Key-value pairs (short key followed by colon)
        if (/^.{2,25}:/.test(t) && t.indexOf(":") < 26) {
          const colonIdx = t.indexOf(":");
          return (
            <p key={li} style={{ fontSize: 13.5, lineHeight: 1.8, color: "#2d2d2d", marginTop: 4 }}>
              <span style={{ color: modColor, fontWeight: 600 }}>{t.slice(0, colonIdx + 1)}</span>
              {t.slice(colonIdx + 1)}
            </p>
          );
        }

        // Regular text
        return (
          <p key={li} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#2d2d2d", margin: "2px 0" }}>
            {t}
          </p>
        );
      })}
    </div>
  ));
}

// ---------------------------------------------------------------------------
// Highlight helper
// ---------------------------------------------------------------------------

function highlightText(text: string, query: string) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(194,54,22,0.15)", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chip component (matching original template)
// ---------------------------------------------------------------------------

function Chip({ children, active, onClick, color }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        border: active ? "1px solid " + color : "1px solid #e0e0e0",
        background: active ? color + "14" : "#f5f0e8",
        color: active ? color : "#999",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// NavBtn component
// ---------------------------------------------------------------------------

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#f5f0e8",
        color: "#666",
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f5f5f0";
        e.currentTarget.style.color = "#333";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#f5f0e8";
        e.currentTarget.style.color = "#666";
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function InterviewBoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  // State
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModuleFilter, setActiveModuleFilter] = useState<string | null>(null);
  const [activeQtypeFilter, setActiveQtypeFilter] = useState<string | null>(null);
  const [showUndoneOnly, setShowUndoneOnly] = useState(false);
  const [modalCardNum, setModalCardNum] = useState<number | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const generatingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchBoard = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from("interview_boards")
        .select("*")
        .eq("id", boardId)
        .single();

      if (fetchErr) throw new Error(fetchErr.message);
      if (!data) throw new Error("Board not found");

      setBoard(data as Board);
      return data as Board;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
      return null;
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/interview/${boardId}/progress`);
      if (res.ok) {
        const data = await res.json();
        if (data.completedCards && Array.isArray(data.completedCards)) {
          setCompletedCards(new Set(data.completedCards));
        }
      }
    } catch {
      // Silently fail on progress fetch
    }
  }, [boardId]);

  // ---------------------------------------------------------------------------
  // Client-driven answer generation (Vercel-compatible)
  // ---------------------------------------------------------------------------

  const driveGeneration = useCallback(async (b: Board) => {
    if (generatingRef.current) return;
    if (b.status !== "generating_answers") return;
    if (!b.modules || b.modules.length === 0) return;

    generatingRef.current = true;

    // Find the next module that needs answers
    for (let i = 0; i < b.modules.length; i++) {
      const mod = b.modules[i];
      const needsAnswers = !mod.cards || mod.cards.some((c: Card) => !c.a);
      if (!needsAnswers) continue;

      try {
        const res = await fetch(`/api/interview/${boardId}/generate-module`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleIndex: i }),
        });

        if (res.ok) {
          // Refresh board data after each module completes
          const updated = await fetchBoard();
          if (updated && updated.status === "generating_answers") {
            // Continue generating next module
            generatingRef.current = false;
            driveGeneration(updated);
            return;
          }
        } else {
          console.error("Module generation failed:", await res.text());
        }
      } catch (err) {
        console.error("Module generation error:", err);
      }

      break; // Only process one module per call
    }

    generatingRef.current = false;
  }, [boardId, fetchBoard]);

  // Initial load
  useEffect(() => {
    async function init() {
      const b = await fetchBoard();
      await fetchProgress();

      // If board is still generating answers, drive generation from client
      if (b && b.status === "generating_answers") {
        driveGeneration(b);
      }
    }

    init();
  }, [boardId, fetchBoard, fetchProgress, driveGeneration]);

  // ---------------------------------------------------------------------------
  // Progress saving
  // ---------------------------------------------------------------------------

  const toggleCardComplete = useCallback(
    async (cardNum: number) => {
      const next = new Set(completedCards);
      if (next.has(cardNum)) {
        next.delete(cardNum);
      } else {
        next.add(cardNum);
      }
      setCompletedCards(next);

      setSavingProgress(true);
      try {
        await fetch(`/api/interview/${boardId}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedCards: Array.from(next) }),
        });
      } catch {
        // Silently fail
      } finally {
        setSavingProgress(false);
      }
    },
    [boardId, completedCards]
  );

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const allCards = useMemo(() => {
    if (!board?.modules) return [];
    return board.modules.flatMap((m) => m.cards || []);
  }, [board]);

  const totalQuestions = allCards.length;
  const completedCount = allCards.filter((c) => completedCards.has(c.num)).length;
  const completionPct = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  const readMin = (cc: number) => Math.max(1, Math.ceil(cc / 280));

  // Module metadata (colors + icons assigned dynamically)
  const modulesMeta = useMemo(() => {
    if (!board?.modules) return [];
    return board.modules.map((mod, idx) => ({
      ...mod,
      color: MODULE_COLORS[idx % MODULE_COLORS.length],
      icon: MODULE_ICONS[idx % MODULE_ICONS.length],
      idx,
    }));
  }, [board]);

  // Card lookup (enriched with module info)
  const cardLookup = useMemo(() => {
    const map = new Map<number, Card & { modColor: string; modIcon: string; modName: string }>();
    modulesMeta.forEach((mod) => {
      (mod.cards || []).forEach((c) => {
        map.set(c.num, { ...c, modColor: mod.color, modIcon: mod.icon, modName: mod.title });
      });
    });
    return map;
  }, [modulesMeta]);

  // ---------------------------------------------------------------------------
  // Filtering & search
  // ---------------------------------------------------------------------------

  const filteredModules = useMemo(() => {
    const lowerQ = searchQuery.toLowerCase();

    return modulesMeta
      .map((mod) => {
        // Module name filter
        if (activeModuleFilter && mod.title !== activeModuleFilter) return null;

        let cards = mod.cards || [];

        // QTYPE filter
        if (activeQtypeFilter) {
          cards = cards.filter((c) => c.qtype === activeQtypeFilter);
        }

        // Undone-only filter
        if (showUndoneOnly) {
          cards = cards.filter((c) => !completedCards.has(c.num));
        }

        // Search filter
        if (lowerQ) {
          cards = cards.filter(
            (c) =>
              c.q.toLowerCase().includes(lowerQ) ||
              (c.a && c.a.toLowerCase().includes(lowerQ))
          );
        }

        if (cards.length === 0) return null;

        // Track which cards have title matches for sorting priority
        const titleHits = new Set<number>();
        if (lowerQ) {
          cards.forEach((c) => {
            if (c.q.toLowerCase().includes(lowerQ)) titleHits.add(c.num);
          });
          // Sort: title matches first
          if (titleHits.size > 0) {
            cards = [...cards].sort((a, b) => {
              const aHit = titleHits.has(a.num) ? 0 : 1;
              const bHit = titleHits.has(b.num) ? 0 : 1;
              return aHit - bHit;
            });
          }
        }

        return { ...mod, cards, titleHits };
      })
      .filter(Boolean) as (typeof modulesMeta[0] & { titleHits?: Set<number> })[];
  }, [modulesMeta, searchQuery, activeModuleFilter, activeQtypeFilter, showUndoneOnly, completedCards]);

  // Visible card count
  const visibleCardCount = useMemo(() => {
    return filteredModules.reduce((s, m) => s + m.cards.length, 0);
  }, [filteredModules]);

  // Ordered list of all visible card nums for modal navigation
  const visibleCardNums = useMemo(() => {
    return filteredModules.flatMap((m) => m.cards.map((c) => c.num));
  }, [filteredModules]);

  const currentModalCard = modalCardNum !== null ? cardLookup.get(modalCardNum) : null;

  // ---------------------------------------------------------------------------
  // Modal navigation
  // ---------------------------------------------------------------------------

  const navigateModal = useCallback(
    (dir: -1 | 1) => {
      if (modalCardNum === null) return;
      const idx = visibleCardNums.indexOf(modalCardNum);
      if (idx < 0) return;
      const ni = dir === 1 ? (idx + 1) % visibleCardNums.length : (idx - 1 + visibleCardNums.length) % visibleCardNums.length;
      setModalCardNum(visibleCardNums[ni]);
    },
    [modalCardNum, visibleCardNums]
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (modalCardNum === null) return;
      if (e.key === "Escape") {
        setModalCardNum(null);
        setPracticeMode(false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateModal(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateModal(1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalCardNum, navigateModal]);

  // ---------------------------------------------------------------------------
  // Module collapse
  // ---------------------------------------------------------------------------

  const toggleModule = (idx: number) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // QTYPE keys for filter chips
  const qtypeKeys = useMemo(() => {
    if (!board?.qtypes) return [];
    return Object.keys(board.qtypes);
  }, [board]);

  // Generation progress
  const isGenerating = board ? board.status !== "completed" : false;
  const genProgress = useMemo(() => {
    if (!board?.modules) return { complete: 0, total: 0 };
    const total = board.modules.length;
    const complete = board.modules.filter((m) => m.cards && m.cards.every((c) => c.a)).length;
    return { complete, total };
  }, [board]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf7f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e8e8e4", borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#888", fontSize: 14 }}>Loading interview board...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf7f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#C62828", marginBottom: 16, fontSize: 15 }}>{error || "Board not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ color: ACCENT, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const modalIdx = modalCardNum !== null ? visibleCardNums.indexOf(modalCardNum) : -1;

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f0", color: "#1a1a1a", fontFamily: "'Crimson Pro', Georgia, serif" }}>
      {/* ================================================================= */}
      {/* Sticky frosted-glass header                                       */}
      {/* ================================================================= */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(237,230,214,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 20px" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: 2, display: "flex", alignItems: "center" }}
                aria-label="Back to dashboard"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: ACCENT, fontFamily: "'Cinzel Decorative', serif" }}>
                  {board.company_name} — {board.role}
                </h1>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#888", letterSpacing: 0.5 }}>
                  {totalQuestions} questions · {modulesMeta.length} modules
                  {isGenerating && (
                    <span style={{ color: "#D97706", fontWeight: 600, marginLeft: 8 }}>
                      ⏳ Generating {genProgress.complete}/{genProgress.total}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {savingProgress && <span style={{ fontSize: 10, color: "#bbb" }}>Saving...</span>}
              <div style={{ width: 120, height: 6, borderRadius: 3, background: "#d4c9b5", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: completionPct === 100 ? "#2d6a4f" : ACCENT, width: completionPct + "%", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: completionPct === 100 ? "#2d6a4f" : ACCENT }}>
                {completedCount}/{totalQuestions}
              </span>
              <button
                onClick={() => setShowStats(!showStats)}
                style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd", background: showStats ? "#FFF3E0" : "#f5f0e8", color: showStats ? ACCENT : "#888", fontSize: 11, cursor: "pointer" }}
              >
                📊
              </button>
              <Link
                href={`/dashboard/coach?boardId=${boardId}&mode=mock_interviewer`}
                style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: "var(--gold-accent)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
              >
                🤖 AI Coach
              </Link>
              <Link
                href={`/dashboard/simulator?boardId=${boardId}`}
                style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: "var(--vermillion)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
              >
                🎤 Mock Interview
              </Link>
            </div>
          </div>

          {/* Search + filter row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {/* Search box */}
            <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "6px 28px 6px 30px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f0e8", color: "#1a1a1a", fontSize: 12, outline: "none" }}
              />
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, opacity: 0.4 }}>🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 11 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Module filter chips */}
            <div style={{ display: "flex", gap: 3, overflowX: "auto", flexShrink: 0 }}>
              <Chip active={!activeModuleFilter} onClick={() => setActiveModuleFilter(null)} color="#666">
                All
              </Chip>
              {modulesMeta.map((m) => (
                <Chip
                  key={m.idx}
                  active={activeModuleFilter === m.title}
                  onClick={() => setActiveModuleFilter(activeModuleFilter === m.title ? null : m.title)}
                  color={m.color}
                >
                  {m.icon}{m.title.length > 12 ? m.title.slice(0, 12) + "…" : m.title}
                </Chip>
              ))}
            </div>

            {/* QTYPE filter chips */}
            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {qtypeKeys.map((k) => {
                const info = qt(k);
                return (
                  <Chip
                    key={k}
                    active={activeQtypeFilter === k}
                    onClick={() => setActiveQtypeFilter(activeQtypeFilter === k ? null : k)}
                    color={info.color}
                  >
                    {info.icon}{info.desc}
                  </Chip>
                );
              })}
            </div>

            {/* Undone toggle */}
            <Chip active={showUndoneOnly} onClick={() => setShowUndoneOnly(!showUndoneOnly)} color="#1565C0">
              {showUndoneOnly ? "📖 Unreviewed" : "📖 All"}
            </Chip>

            {/* Visible count */}
            <span style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>
              {visibleCardCount} q
            </span>
          </div>
        </div>

        {/* Stats panel (toggle) */}
        {showStats && (
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 20px 10px", borderTop: "1px solid #eee" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {modulesMeta.map((mod) => {
                const t = (mod.cards || []).length;
                const d = (mod.cards || []).filter((c) => completedCards.has(c.num)).length;
                const p = t > 0 ? Math.round((d / t) * 100) : 0;
                return (
                  <div
                    key={mod.idx}
                    onClick={() => setActiveModuleFilter(activeModuleFilter === mod.title ? null : mod.title)}
                    style={{
                      cursor: "pointer",
                      textAlign: "center",
                      padding: "8px 6px",
                      borderRadius: 10,
                      background: "#f5f0e8",
                      border: activeModuleFilter === mod.title ? "2px solid " + mod.color : "1px solid #eee",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: mod.color }}>{d}/{t}</div>
                    <div style={{ width: "100%", height: 3, borderRadius: 2, background: "#eee", marginTop: 4 }}>
                      <div style={{ height: "100%", borderRadius: 2, background: mod.color, width: p + "%", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 9, marginTop: 3, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mod.icon} {mod.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ================================================================= */}
      {/* Main content — module sections with card grids                     */}
      {/* ================================================================= */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 20px 60px" }}>
        {filteredModules.map((mod) => {
          const isCollapsed = collapsedModules.has(mod.idx);
          const modDone = mod.cards.filter((c) => completedCards.has(c.num)).length;
          const modTotal = mod.cards.length;
          const modPct = modTotal > 0 ? (modDone / modTotal * 100) : 0;

          return (
            <section key={mod.idx} style={{ marginBottom: 24 }}>
              {/* Module header button */}
              <button
                onClick={() => toggleModule(mod.idx)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 2,
                  background: "#f5f0e8",
                  border: "1px solid #e8e8e4",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                <span style={{ fontSize: 9, color: "#999", transition: "transform 0.2s", transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)", display: "inline-block" }}>▶</span>
                <span style={{ width: 4, height: 28, borderRadius: 2, background: mod.color, flexShrink: 0 }} />
                <span style={{ fontSize: 22 }}>{mod.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Cinzel Decorative', serif" }}>
                    {searchQuery ? highlightText(mod.title, searchQuery) : mod.title}
                  </div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>
                    {board.round_type} · {modTotal} questions
                  </div>
                </div>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: modDone === modTotal && modDone > 0 ? "#2d6a4f" : "#999", fontWeight: 600 }}>
                  {modDone}/{modTotal}
                </span>
                <div style={{ width: 52, height: 4, borderRadius: 2, background: "#d4c9b5" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: modDone === modTotal && modDone > 0 ? "#2d6a4f" : mod.color, width: modPct + "%", transition: "width 0.3s" }} />
                </div>
              </button>

              {/* Card grid */}
              {!isCollapsed && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, marginTop: 10, paddingLeft: 16 }}>
                  {mod.cards.map((c) => {
                    const isDone = completedCards.has(c.num);
                    const qInfo = qt(c.qtype);
                    const isCardGenerating = isGenerating && !c.a;
                    const charCount = c.charCount || (c.a ? c.a.length : 0);

                    return (
                      <div
                        key={c.num}
                        onClick={() => { if (!isCardGenerating) setModalCardNum(c.num); }}
                        style={{
                          cursor: isCardGenerating ? "default" : "pointer",
                          background: "#f5f0e8",
                          borderRadius: 2,
                          border: "1px solid " + (isDone ? "#8fc4a8" : "#d4c9b5"),
                          borderLeft: "3px solid " + (isDone ? "#2d6a4f" : mod.color),
                          padding: "10px 14px",
                          transition: "all 0.2s",
                          position: "relative",
                          opacity: isCardGenerating ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isCardGenerating) {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px " + mod.color + "18";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Card header row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: qInfo.bg, color: qInfo.color, fontWeight: 600 }}>
                              {qInfo.icon} {qInfo.desc}
                            </span>
                            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#bbb" }}>
                              Q{c.num}
                            </span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCardComplete(c.num); }}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              border: "2px solid " + (isDone ? "#2d6a4f" : "#ddd"),
                              background: isDone ? "#edf5f0" : "transparent",
                              color: isDone ? "#2d6a4f" : "transparent",
                              fontSize: 11,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                          >
                            {isDone ? "✓" : ""}
                          </button>
                        </div>

                        {/* Question text — clamped to 2 lines for scannability */}
                        <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, color: "#2a2a2a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                          {searchQuery && mod.titleHits?.has(c.num) ? highlightText(c.q, searchQuery) : c.q}
                        </h3>

                        {/* Title match indicator */}
                        {searchQuery && mod.titleHits?.has(c.num) && (
                          <span style={{ display: "inline-block", marginTop: 4, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#f8f3e6", color: "#c9a84c", fontWeight: 600 }}>
                            Title match
                          </span>
                        )}

                        {/* Generating state */}
                        {isCardGenerating && (
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 12, height: 12, border: "2px solid #e8e8e4", borderTopColor: "#D97706", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            <span style={{ fontSize: 11, color: "#D97706" }}>Generating answer...</span>
                          </div>
                        )}

                        {/* Footer — char count + reading time */}
                        {!isCardGenerating && c.a && (
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'JetBrains Mono', monospace" }}>
                              {charCount} chars · ~{readMin(charCount)} min
                            </span>
                            <span className="view-hint" style={{ fontSize: 10, color: mod.color, opacity: 0, transition: "opacity 0.2s" }}>
                              View answer →
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* Empty state */}
        {filteredModules.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#999", fontSize: 14 }}>🔍 No matching questions</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveModuleFilter(null); setActiveQtypeFilter(null); setShowUndoneOnly(false); }}
              style={{ marginTop: 8, fontSize: 12, color: ACCENT, background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* Answer Modal (frosted backdrop, rich text rendering)               */}
      {/* ================================================================= */}
      {modalCardNum !== null && currentModalCard && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setModalCardNum(null); setPracticeMode(false); } }}
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, background: "rgba(26,26,26,0.4)", backdropFilter: "blur(6px)" }}
        >
          <div style={{ background: "#f5f0e8", borderRadius: 4, width: "100%", maxWidth: 820, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e0e0e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", animation: "modalIn 0.25s ease-out" }}>
            {/* Modal header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", flexShrink: 0, background: "#ede6d6" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: qt(currentModalCard.qtype).bg, color: qt(currentModalCard.qtype).color, fontWeight: 600 }}>
                    {qt(currentModalCard.qtype).icon} {qt(currentModalCard.qtype).desc}
                  </span>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: currentModalCard.modColor + "12", color: currentModalCard.modColor, fontWeight: 500 }}>
                    {currentModalCard.modIcon} {currentModalCard.modName}
                  </span>
                  <span style={{ fontSize: 10, color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>
                    Q{currentModalCard.num} · {currentModalCard.charCount || (currentModalCard.a ? currentModalCard.a.length : 0)} chars · ~{readMin(currentModalCard.charCount || (currentModalCard.a ? currentModalCard.a.length : 0))} min
                  </span>
                </div>
                <button
                  onClick={() => { setModalCardNum(null); setPracticeMode(false); }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #ddd", background: "#f5f0e8", color: "#999", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.5, color: "#1a1a1a" }}>
                {currentModalCard.q}
              </h2>
            </div>

            {/* Modal body — rich answer or practice panel */}
            <div style={{ flex: 1, overflowY: "auto", padding: practiceMode ? "0" : "20px 24px", background: "#f5f0e8" }}>
              {practiceMode ? (
                <SpeechPracticePanel
                  question={currentModalCard.q}
                  onBack={() => setPracticeMode(false)}
                />
              ) : currentModalCard.a ? (
                renderAnswer(currentModalCard.a, currentModalCard.modColor)
              ) : (
                <div style={{ color: "#999", fontStyle: "italic", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #e8e8e4", borderTopColor: "#D97706", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  Answer is being generated...
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#ede6d6" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => toggleCardComplete(currentModalCard.num)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: completedCards.has(currentModalCard.num) ? "#edf5f0" : "#f5f5f0",
                    color: completedCards.has(currentModalCard.num) ? "#2d6a4f" : "#888",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {completedCards.has(currentModalCard.num) ? "✓ Reviewed" : "○ Mark as Reviewed"}
                </button>
                <button
                  onClick={() => setPracticeMode(!practiceMode)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: practiceMode ? "#FFF3E0" : "#f5f5f0",
                    color: practiceMode ? "#E65100" : "#888",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {practiceMode ? "🎤 Practicing" : "🎤 Practice"}
                </button>
                <Link
                  href={`/dashboard/coach?boardId=${boardId}&questionId=${currentModalCard.num}&mode=answer_improver`}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold-accent)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  ✨ Improve
                </Link>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <NavBtn onClick={() => { setPracticeMode(false); navigateModal(-1); }}>← Prev</NavBtn>
                <NavBtn onClick={() => { setPracticeMode(false); navigateModal(1); }}>Next →</NavBtn>
                <button
                  onClick={() => { setModalCardNum(null); setPracticeMode(false); }}
                  style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: currentModalCard.modColor, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #e8e8e4" }}>
        <p style={{ fontSize: 10, color: "#bbb", lineHeight: 1.6 }}>
          {totalQuestions} questions · {modulesMeta.length} modules · {board.round_type}
        </p>
      </footer>

      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { transform: translateY(16px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        div:hover > .view-hint { opacity: 1 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #ede6d6; }
        ::-webkit-scrollbar-thumb { background: #c4c4c4; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #888888; }
      `}</style>
    </div>
  );
}
