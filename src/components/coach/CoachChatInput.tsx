"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  onSend: (message: string) => void;
  onAbort: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function CoachChatInput({
  onSend,
  onAbort,
  isLoading,
  disabled,
}: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      className="border-t"
      style={{
        borderColor: "var(--paper-dark)",
        background: "var(--paper-cream)",
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            placeholder="Type your message..."
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none rounded-sm border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{
              borderColor: "var(--paper-dark)",
              background: "var(--paper-white)",
              color: "var(--ink-black)",
              fontFamily: "'Crimson Pro', Georgia, serif",
              maxHeight: 200,
            }}
          />
          {isLoading ? (
            <button
              onClick={onAbort}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm transition-colors cursor-pointer"
              style={{ background: "var(--vermillion)", color: "#fff" }}
              title="Stop generating"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <rect x="3" y="3" width="10" height="10" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm transition-colors disabled:opacity-40 cursor-pointer"
              style={{ background: "var(--ink-dark)", color: "#fff" }}
              title="Send message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
