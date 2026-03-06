"use client";

import type { CoachMode, CoachSession } from "@/types/coach";
import { QUICK_ACTIONS } from "@/lib/coaching-templates";

interface ContextOption {
  id: string;
  label: string;
}

interface Props {
  currentMode: CoachMode | null;
  onModeChange: (mode: CoachMode) => void;
  sessions: CoachSession[];
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onQuickAction: (prompt: string) => void;
  contextOptions: {
    resumes: ContextOption[];
    boards: ContextOption[];
  };
  selectedContext: {
    resumeId?: string;
    boardId?: string;
  };
  onContextChange: (context: {
    resumeId?: string;
    boardId?: string;
  }) => void;
  currentSessionId?: string;
}

const MODE_LABELS: Record<
  CoachMode,
  { label: string; icon: string; color: string }
> = {
  general: { label: "Career Coach", icon: "\u{1F3AF}", color: "var(--gold-accent)" },
  mock_interviewer: { label: "Mock Interview", icon: "\u{1F3A4}", color: "var(--vermillion)" },
  resume_coach: { label: "Resume Coach", icon: "\u{1F4DD}", color: "var(--jade-green)" },
  answer_improver: { label: "Answer Improver", icon: "\u{2728}", color: "var(--ink-dark)" },
};

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function CoachSidebar({
  currentMode,
  onModeChange,
  sessions,
  onSelectSession,
  onNewChat,
  onQuickAction,
  contextOptions,
  selectedContext,
  onContextChange,
  currentSessionId,
}: Props) {
  return (
    <aside
      className="w-64 shrink-0 border-r flex flex-col h-full overflow-hidden"
      style={{
        borderColor: "var(--paper-dark)",
        background: "var(--paper-cream)",
      }}
    >
      {/* New Chat button */}
      <div
        className="p-3 border-b"
        style={{ borderColor: "var(--paper-dark)" }}
      >
        <button
          onClick={onNewChat}
          className="w-full text-sm font-medium px-3 py-2 rounded-sm transition-colors cursor-pointer"
          style={{ background: "var(--ink-dark)", color: "#fff" }}
        >
          + New Chat
        </button>
      </div>

      {/* Mode selector */}
      <div
        className="p-3 border-b"
        style={{ borderColor: "var(--paper-dark)" }}
      >
        <p
          className="text-xs font-semibold mb-2 uppercase tracking-wide"
          style={{ color: "var(--ink-mid)" }}
        >
          Mode
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(MODE_LABELS) as CoachMode[]).map((mode) => {
            const { label, icon, color } = MODE_LABELS[mode];
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className="text-left text-xs px-2 py-1.5 rounded-sm transition-all cursor-pointer"
                style={{
                  background: isActive ? "rgba(255,255,255,0.7)" : "transparent",
                  borderLeft: `2px solid ${isActive ? color : "transparent"}`,
                  color: "var(--ink-black)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {icon} {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Context picker */}
      {currentMode && (
        <div
          className="p-3 border-b"
          style={{ borderColor: "var(--paper-dark)" }}
        >
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "var(--ink-mid)" }}
          >
            Context
          </p>

          {/* Resume selector */}
          {contextOptions.resumes.length > 0 && (
            <div className="mb-2">
              <label
                className="text-xs block mb-1"
                style={{ color: "var(--ink-light)" }}
              >
                Resume
              </label>
              <select
                value={selectedContext.resumeId || ""}
                onChange={(e) =>
                  onContextChange({
                    ...selectedContext,
                    resumeId: e.target.value || undefined,
                  })
                }
                className="w-full text-xs px-2 py-1 rounded-sm border"
                style={{
                  borderColor: "var(--paper-dark)",
                  background: "var(--paper-white)",
                  color: "var(--ink-black)",
                }}
              >
                <option value="">None</option>
                {contextOptions.resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Board selector */}
          {contextOptions.boards.length > 0 && (
            <div>
              <label
                className="text-xs block mb-1"
                style={{ color: "var(--ink-light)" }}
              >
                Interview Board
              </label>
              <select
                value={selectedContext.boardId || ""}
                onChange={(e) =>
                  onContextChange({
                    ...selectedContext,
                    boardId: e.target.value || undefined,
                  })
                }
                className="w-full text-xs px-2 py-1 rounded-sm border"
                style={{
                  borderColor: "var(--paper-dark)",
                  background: "var(--paper-white)",
                  color: "var(--ink-black)",
                }}
              >
                <option value="">None</option>
                {contextOptions.boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      {currentMode && (
        <div
          className="p-3 border-b"
          style={{ borderColor: "var(--paper-dark)" }}
        >
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "var(--ink-mid)" }}
          >
            Quick Start
          </p>
          <div className="space-y-1">
            {QUICK_ACTIONS[currentMode].slice(0, 3).map((action, i) => (
              <button
                key={i}
                onClick={() => onQuickAction(action.prompt)}
                className="w-full text-left text-xs px-2 py-1.5 rounded-sm transition-colors cursor-pointer"
                style={{ color: "var(--ink-black)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session history */}
      <div className="flex-1 overflow-y-auto p-3">
        <p
          className="text-xs font-semibold mb-2 uppercase tracking-wide"
          style={{ color: "var(--ink-mid)" }}
        >
          History
        </p>
        {sessions.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>
            No previous sessions
          </p>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => {
              const modeInfo = MODE_LABELS[session.coach_mode];
              return (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-sm transition-colors cursor-pointer"
                  style={{
                    background:
                      currentSessionId === session.id
                        ? "rgba(255,255,255,0.7)"
                        : "transparent",
                    color: "var(--ink-black)",
                  }}
                  title={session.title || "Untitled"}
                >
                  <div className="flex items-center gap-1">
                    <span>{modeInfo?.icon}</span>
                    <span className="truncate flex-1">
                      {session.title || "Untitled"}
                    </span>
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--ink-light)" }}
                  >
                    {timeAgo(session.updated_at)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
