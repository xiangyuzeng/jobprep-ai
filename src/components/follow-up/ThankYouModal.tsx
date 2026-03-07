"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  role: string;
  sessionId?: string;
  boardId?: string;
}

export default function ThankYouModal({
  isOpen,
  onClose,
  companyName,
  role,
  sessionId,
  boardId,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [interviewerName, setInterviewerName] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [body]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase("form");
      setSubject("");
      setBody("");
      setKeyPoints([]);
      setError("");
      setCopied(false);
    }
  }, [isOpen]);

  const generate = useCallback(async () => {
    setPhase("loading");
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/follow-up/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          role,
          sessionId,
          boardId,
          interviewerName: interviewerName.trim() || undefined,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate email");
      }

      const data = await res.json();
      setSubject(data.subject || "");
      setBody(data.body || "");
      setKeyPoints(data.keyPoints || []);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("form");
    }
  }, [companyName, role, sessionId, boardId, interviewerName, additionalContext]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  function handleOpenInMail() {
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_self"
    );
  }

  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-[var(--vermillion)] focus:ring-1 focus:ring-[var(--vermillion)]";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4"
        style={{ border: "1px solid var(--paper-dark)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-cinzel text-lg font-semibold text-gray-900">
            Thank-You Email
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Form Phase */}
          {phase === "form" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate a personalized thank-you email for your{" "}
                <span className="font-medium text-gray-900">{role}</span> interview at{" "}
                <span className="font-medium text-gray-900">{companyName}</span>.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Interviewer Name (optional)
                </label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Sarah Chen"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Additional Context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className={inputClass}
                  rows={2}
                  placeholder="e.g. We discussed the new data platform migration, she mentioned the team is hiring 3 more engineers"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={generate}
                className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-sm transition-colors"
                style={{ background: "#2d6a4f" }}
              >
                Generate Email
              </button>
            </div>
          )}

          {/* Loading Phase */}
          {phase === "loading" && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-[#2d6a4f] rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Generating your thank-you email...</p>
            </div>
          )}

          {/* Result Phase */}
          {phase === "result" && (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={`${inputClass} resize-none`}
                  style={{ minHeight: 200 }}
                />
              </div>

              {/* Key Points */}
              {keyPoints.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Key points referenced</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keyPoints.map((point, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "#ecfdf5", color: "#2d6a4f" }}
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <p className="text-[11px] text-gray-400 italic">
                Review and personalize before sending — add the interviewer&apos;s name if you haven&apos;t already.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-sm transition-colors"
                  style={{
                    background: copied ? "#ecfdf5" : "#2d6a4f",
                    color: copied ? "#2d6a4f" : "#fff",
                    border: copied ? "1px solid #6ee7b7" : "none",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={handleOpenInMail}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Open in Mail
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generate}
                  className="flex-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ↻ Regenerate
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
