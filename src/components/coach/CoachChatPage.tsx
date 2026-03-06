"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import CoachModeSelector from "./CoachModeSelector";
import CoachSidebar from "./CoachSidebar";
import CoachChatMessages from "./CoachChatMessages";
import CoachChatInput from "./CoachChatInput";
import CoachFollowUpChips from "./CoachFollowUpChips";
import { generateFollowUps } from "@/lib/coaching-followups";
import type { CoachMode, CoachMessage, CoachSession } from "@/types/coach";

interface Props {
  resumes: Array<{ id: string; original_filename: string }>;
  boards: Array<{ id: string; company_name: string; role: string }>;
  initialSessions: CoachSession[];
  initialMode?: CoachMode;
  initialBoardId?: string;
  initialTailoredResumeId?: string;
  initialSessionId?: string;
}

const MODE_LABELS: Record<CoachMode, string> = {
  general: "Career Coach",
  mock_interviewer: "Mock Interview",
  resume_coach: "Resume Coach",
  answer_improver: "Answer Improver",
};

export default function CoachChatPage({
  resumes,
  boards,
  initialSessions,
  initialMode,
  initialBoardId,
  initialTailoredResumeId,
  initialSessionId,
}: Props) {
  // ── State ──
  const [currentMode, setCurrentMode] = useState<CoachMode | null>(
    initialMode || null
  );
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId
  );
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<CoachSession[]>(initialSessions);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [tokenInfo, setTokenInfo] = useState<{
    input: number;
    output: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Context selections
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(
    undefined
  );
  const [selectedBoardId, setSelectedBoardId] = useState<string | undefined>(
    initialBoardId
  );
  const [selectedTailoredResumeId] = useState<string | undefined>(
    initialTailoredResumeId
  );

  // ── Refs (critical for streaming) ──
  const streamingContentRef = useRef("");
  const [streamingDisplay, setStreamingDisplay] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);

  // ── Load session messages when resuming a session ──
  useEffect(() => {
    if (initialSessionId) {
      loadSessionMessages(initialSessionId);
      // Find the session to set the mode
      const session = initialSessions.find((s) => s.id === initialSessionId);
      if (session) {
        setCurrentMode(session.coach_mode);
      }
    }
  }, [initialSessionId, initialSessions]);

  const loadSessionMessages = async (sid: string) => {
    try {
      const res = await fetch(`/api/coach/sessions/${sid}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // Silently fail — empty chat is acceptable
    }
  };

  const refreshSessions = async () => {
    try {
      const res = await fetch("/api/coach/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Silently fail
    }
  };

  // ── Core: sendMessage ──
  const sendMessage = useCallback(
    async (text: string) => {
      if (!currentMode || isLoading) return;

      // Optimistic user message
      const userMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setFollowUps([]);
      setTokenInfo(null);
      streamingContentRef.current = "";
      setStreamingDisplay("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId,
            coachMode: currentMode,
            resumeId: selectedResumeId,
            tailoredResumeId: selectedTailoredResumeId,
            boardId: selectedBoardId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        currentRequestIdRef.current =
          response.headers.get("X-Request-Id");

        // Parse NDJSON stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);

              if (chunk.type === "system") {
                if (!sessionId) {
                  setSessionId(chunk.sessionId);
                  window.history.replaceState(
                    null,
                    "",
                    `/dashboard/coach?sessionId=${chunk.sessionId}`
                  );
                }
              } else if (chunk.type === "assistant") {
                streamingContentRef.current += chunk.text;
                setStreamingDisplay(streamingContentRef.current);
              } else if (chunk.type === "done") {
                const assistantMsg: CoachMessage = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: streamingContentRef.current,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingDisplay("");
                streamingContentRef.current = "";
                setTokenInfo({
                  input: chunk.inputTokens,
                  output: chunk.outputTokens,
                });

                const suggestions = generateFollowUps(
                  currentMode,
                  assistantMsg.content,
                  messages.length + 2
                );
                setFollowUps(suggestions);

                // Refresh sessions list to pick up new/updated session
                refreshSessions();
              } else if (chunk.type === "error") {
                const errorMsg: CoachMessage = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: `Error: ${chunk.message}. Please try again.`,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, errorMsg]);
                setStreamingDisplay("");
                streamingContentRef.current = "";
              } else if (chunk.type === "aborted") {
                if (streamingContentRef.current) {
                  const partialMsg: CoachMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                      streamingContentRef.current +
                      "\n\n*(generation stopped)*",
                    created_at: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, partialMsg]);
                }
                setStreamingDisplay("");
                streamingContentRef.current = "";
              }
            } catch {
              // Malformed JSON line — skip
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          const errorMsg: CoachMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Network error. Please check your connection and try again.",
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setStreamingDisplay("");
          streamingContentRef.current = "";
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        currentRequestIdRef.current = null;
      }
    },
    [
      currentMode,
      sessionId,
      selectedResumeId,
      selectedTailoredResumeId,
      selectedBoardId,
      isLoading,
      messages.length,
    ]
  );

  // ── Abort handler ──
  const handleAbort = useCallback(async () => {
    abortControllerRef.current?.abort();

    if (currentRequestIdRef.current) {
      fetch("/api/coach/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: currentRequestIdRef.current }),
      }).catch(() => {});
    }
  }, []);

  // ── New chat handler ──
  const handleNewChat = useCallback(() => {
    setSessionId(undefined);
    setMessages([]);
    setFollowUps([]);
    setTokenInfo(null);
    setCurrentMode(null);
    streamingContentRef.current = "";
    setStreamingDisplay("");
    window.history.replaceState(null, "", "/dashboard/coach");
    setSidebarOpen(false);
  }, []);

  // ── Delete session ──
  const handleDeleteSession = useCallback(
    async (sid: string) => {
      try {
        const res = await fetch(`/api/coach/sessions?id=${sid}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setSessions((prev) => prev.filter((s) => s.id !== sid));
          // If we deleted the current session, reset to new chat
          if (sessionId === sid) {
            handleNewChat();
          }
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete session");
        }
      } catch {
        alert("Failed to delete session");
      }
    },
    [sessionId, handleNewChat]
  );

  // ── Select existing session ──
  const handleSelectSession = useCallback(
    async (sid: string) => {
      const session = sessions.find((s) => s.id === sid);
      if (!session) return;

      setSessionId(sid);
      setCurrentMode(session.coach_mode);
      setFollowUps([]);
      setTokenInfo(null);
      streamingContentRef.current = "";
      setStreamingDisplay("");
      window.history.replaceState(
        null,
        "",
        `/dashboard/coach?sessionId=${sid}`
      );
      setSidebarOpen(false);

      await loadSessionMessages(sid);
    },
    [sessions]
  );

  // ── Mode change handler ──
  const handleModeChange = useCallback((mode: CoachMode) => {
    setCurrentMode(mode);
    setSessionId(undefined);
    setMessages([]);
    setFollowUps([]);
    setTokenInfo(null);
    streamingContentRef.current = "";
    setStreamingDisplay("");
    setSidebarOpen(false);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading) {
        handleAbort();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "n") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, handleAbort, handleNewChat]);

  // ── Render ──
  const showWelcome = !currentMode && !sessionId;

  return (
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <div className="flex h-full">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden"}
            lg:relative lg:flex lg:z-auto
          `}
          style={{ top: 56 }}
        >
          <CoachSidebar
            currentMode={currentMode}
            onModeChange={handleModeChange}
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onNewChat={handleNewChat}
            onQuickAction={(prompt) => {
              if (currentMode) {
                setSidebarOpen(false);
                sendMessage(prompt);
              }
            }}
            contextOptions={{
              resumes: resumes.map((r) => ({
                id: r.id,
                label: r.original_filename || "Resume",
              })),
              boards: boards.map((b) => ({
                id: b.id,
                label: `${b.company_name} — ${b.role}`,
              })),
            }}
            selectedContext={{
              resumeId: selectedResumeId,
              boardId: selectedBoardId,
            }}
            onContextChange={(ctx) => {
              setSelectedResumeId(ctx.resumeId);
              setSelectedBoardId(ctx.boardId);
            }}
            currentSessionId={sessionId}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          {!showWelcome && (
            <div
              className="flex items-center gap-2 lg:hidden px-4 py-2 border-b"
              style={{ borderColor: "var(--paper-dark)" }}
            >
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 cursor-pointer"
                style={{ color: "var(--ink-black)" }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <span
                className="text-sm font-cinzel font-semibold"
                style={{ color: "var(--ink-black)" }}
              >
                AI Coach
                {currentMode && ` \u2014 ${MODE_LABELS[currentMode]}`}
              </span>
            </div>
          )}

          {showWelcome ? (
            <CoachModeSelector onSelectMode={handleModeChange} />
          ) : (
            <>
              <CoachChatMessages
                messages={messages}
                streamingContent={streamingDisplay}
                isLoading={isLoading}
              />
              <CoachFollowUpChips
                suggestions={followUps}
                onSelect={(text) => sendMessage(text)}
                disabled={isLoading}
              />
              {tokenInfo && (
                <div
                  className="text-center text-xs py-1"
                  style={{ color: "var(--ink-light)" }}
                >
                  Tokens: {tokenInfo.input.toLocaleString()} in /{" "}
                  {tokenInfo.output.toLocaleString()} out
                </div>
              )}
              <CoachChatInput
                onSend={sendMessage}
                onAbort={handleAbort}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
