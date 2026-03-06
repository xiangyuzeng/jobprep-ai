"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CoachMessage } from "@/types/coach";
import type { Components } from "react-markdown";

interface Props {
  messages: CoachMessage[];
  streamingContent: string;
  isLoading: boolean;
}

// ── Markdown component overrides for wuxia theme ──
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3
      className="font-cinzel text-base font-bold mt-3 mb-1"
      style={{ color: "var(--ink-black)" }}
    >
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h4
      className="font-cinzel text-sm font-bold mt-2 mb-1"
      style={{ color: "var(--ink-black)" }}
    >
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h5
      className="font-cinzel text-sm font-semibold mt-2 mb-1"
      style={{ color: "var(--ink-dark)" }}
    >
      {children}
    </h5>
  ),
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-2 pl-3 my-2 italic"
      style={{ borderColor: "var(--gold-accent)", color: "var(--ink-mid)" }}
    >
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: "var(--ink-black)" }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em style={{ color: "var(--ink-mid)" }}>{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
      style={{ color: "var(--vermillion)" }}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre
          className="font-mono text-xs p-3 rounded overflow-x-auto my-2"
          style={{
            background: "var(--ink-black)",
            color: "var(--paper-light)",
          }}
        >
          <code {...props}>{children}</code>
        </pre>
      );
    }
    return (
      <code
        className="font-mono text-xs px-1 py-0.5 rounded"
        style={{
          background: "var(--paper-cream)",
          color: "var(--vermillion)",
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table
        className="text-xs border-collapse w-full"
        style={{ borderColor: "var(--paper-dark)" }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="border px-2 py-1 text-left font-semibold"
      style={{
        borderColor: "var(--paper-dark)",
        background: "var(--paper-cream)",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="border px-2 py-1"
      style={{ borderColor: "var(--paper-dark)" }}
    >
      {children}
    </td>
  ),
  hr: () => (
    <hr className="my-3" style={{ borderColor: "var(--paper-dark)" }} />
  ),
};

// ── Message bubble component ──
function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: string;
  content: string;
  isStreaming?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="rounded-sm px-4 py-2.5 max-w-[80%] text-sm whitespace-pre-wrap"
          style={{ background: "var(--vermillion)", color: "#fff" }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Assistant message — render markdown
  return (
    <div className="flex items-start">
      <div
        className="rounded-sm px-4 py-3 max-w-[80%] border text-sm"
        style={{
          background: "#fff",
          borderColor: "var(--paper-dark)",
          color: "var(--ink-black)",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
        {isStreaming && (
          <span
            className="inline-block w-1.5 h-4 ml-0.5 animate-pulse"
            style={{ background: "var(--vermillion)" }}
          />
        )}
      </div>
    </div>
  );
}

export default function CoachChatMessages({
  messages,
  streamingContent,
  isLoading,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {/* Streaming assistant message */}
        {streamingContent && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}

        {/* Loading indicator (typing dots) */}
        {isLoading && !streamingContent && (
          <div className="flex items-start">
            <div
              className="bg-white border rounded-sm px-4 py-3"
              style={{ borderColor: "var(--paper-dark)" }}
            >
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "var(--ink-light)",
                    animationDelay: "0ms",
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "var(--ink-light)",
                    animationDelay: "150ms",
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "var(--ink-light)",
                    animationDelay: "300ms",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
