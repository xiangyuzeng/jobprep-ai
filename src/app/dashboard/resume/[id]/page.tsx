"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillGapItem {
  skill: string;
  status: "matched" | "strengthen" | "missing";
  note: string;
}

interface SkillGap {
  critical: SkillGapItem[];
  recommended: SkillGapItem[];
  optional: SkillGapItem[];
}

interface JDAnalysis {
  job_title: string;
  company: string;
  required_skills: string[];
  preferred_skills: string[];
  keywords: string[];
  experience_years: string;
}

interface Suggestion {
  id: string;
  type: string;
  section: string;
  experienceIndex?: number;
  bulletIndex?: number;
  original: string;
  replacement: string;
  reason: string;
  priority: "critical" | "recommended" | "optional";
}

interface KeywordMatches {
  matched: { keyword: string; locations: string[] }[];
  missing: string[];
}

interface TailorResult {
  jd_analysis: JDAnalysis;
  skill_gap: SkillGap;
  match_score: number;
  suggestions: Suggestion[];
  keyword_matches: KeywordMatches;
}

interface ResumeData {
  id: string;
  original_filename: string;
  parsed_data: Record<string, unknown>;
  created_at: string;
}

type PageState =
  | "loading"
  | "idle"
  | "generating"
  | "results"
  | "error";

type RightTab = "resume" | "cover-letter";

// ---------------------------------------------------------------------------
// Circular Progress Component
// ---------------------------------------------------------------------------

function CircularProgress({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "text-green-500"
      : score >= 60
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-700 ease-out`}
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-900">
        {score}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Priority Badge Component
// ---------------------------------------------------------------------------

function PriorityBadge({
  priority,
}: {
  priority: "critical" | "recommended" | "optional";
}) {
  const styles = {
    critical: "bg-red-100 text-red-700 border-red-200",
    recommended: "bg-yellow-100 text-yellow-700 border-yellow-200",
    optional: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Type Label Component
// ---------------------------------------------------------------------------

function TypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    summary_rewrite: "Summary Rewrite",
    title_align: "Title Alignment",
    keyword_add: "Keyword Add",
    reorder: "Relevance Reorder",
    quantify: "Impact Quantify",
    skill_match: "Skill Match",
    de_emphasize: "De-emphasize",
  };

  return (
    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
      {labels[type] || type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skill Gap Panel Component
// ---------------------------------------------------------------------------

function SkillGapPanel({ skillGap }: { skillGap: SkillGap }) {
  const sections: {
    key: keyof SkillGap;
    label: string;
    badgeClass: string;
  }[] = [
    {
      key: "critical",
      label: "Critical",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
    },
    {
      key: "recommended",
      label: "Recommended",
      badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    {
      key: "optional",
      label: "Optional",
      badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Skill Gap Analysis</h3>
      {sections.map(({ key, label, badgeClass }) => {
        const items = skillGap[key];
        if (!items || items.length === 0) return null;
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}
              >
                {label}
              </span>
              <span className="text-xs text-gray-400">
                {items.length} skill{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm bg-white rounded-md border border-gray-100 px-3 py-2"
                >
                  {item.status === "matched" && (
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {item.status === "strengthen" && (
                    <svg
                      className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M12 3l9 18H3L12 3z"
                      />
                    </svg>
                  )}
                  {item.status === "missing" && (
                    <svg
                      className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.skill}
                    </span>
                    <p className="text-gray-500 text-xs mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyword Chips Component
// ---------------------------------------------------------------------------

function KeywordChips({ keywords }: { keywords: KeywordMatches }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Keyword Matches</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.matched.map((kw, i) => (
          <span
            key={`m-${i}`}
            className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {kw.keyword}
          </span>
        ))}
        {keywords.missing.map((kw, i) => (
          <span
            key={`x-${i}`}
            className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggestion Card Component
// ---------------------------------------------------------------------------

function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  status,
}: {
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
  status: "pending" | "accepted" | "rejected";
}) {
  const [showReason, setShowReason] = useState(false);

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all ${
        status === "accepted"
          ? "border-green-300 bg-green-50/30"
          : status === "rejected"
          ? "border-red-200 bg-red-50/20 opacity-60"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <PriorityBadge priority={suggestion.priority} />
        <TypeLabel type={suggestion.type} />
        <span className="text-xs text-gray-400 capitalize">
          {suggestion.section}
          {suggestion.experienceIndex !== undefined &&
            ` #${suggestion.experienceIndex + 1}`}
        </span>
      </div>

      {/* Original text */}
      {suggestion.original && (
        <div className="mb-2">
          <p className="text-xs text-gray-400 mb-1">Original:</p>
          <p className="text-sm text-gray-500 line-through bg-red-50 rounded px-2 py-1.5 border border-red-100">
            {suggestion.original}
          </p>
        </div>
      )}

      {/* Replacement text */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Suggested:</p>
        <p className="text-sm text-gray-900 bg-green-50 rounded px-2 py-1.5 border border-green-100">
          {suggestion.replacement}
        </p>
      </div>

      {/* Reason tooltip */}
      <div className="mb-3">
        <button
          onClick={() => setShowReason(!showReason)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {showReason ? "Hide reason" : "Why this change?"}
        </button>
        {showReason && (
          <p className="text-xs text-gray-600 mt-1.5 bg-blue-50 rounded px-2 py-1.5 border border-blue-100">
            {suggestion.reason}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {status === "pending" ? (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 text-xs font-medium py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="flex-1 text-xs font-medium py-1.5 rounded-md bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Reject
          </button>
        </div>
      ) : (
        <div
          className={`text-xs font-medium text-center py-1.5 rounded-md ${
            status === "accepted"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {status === "accepted" ? "Accepted" : "Rejected"}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streaming Dots Loader
// ---------------------------------------------------------------------------

function StreamingLoader({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-8">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ResumeTailorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const resumeId = params.id;

  // Core state
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [error, setError] = useState("");

  // JD + analysis
  const [jobDescription, setJobDescription] = useState("");
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState<TailorResult | null>(null);
  const [tailoredResumeId, setTailoredResumeId] = useState<string | null>(null);

  // Suggestion decisions
  const [decisions, setDecisions] = useState<
    Record<string, "accepted" | "rejected">
  >({});

  // Right panel tab
  const [rightTab, setRightTab] = useState<RightTab>("resume");

  // Cover letter
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);

  // PDF download
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Abort controller for streaming
  const abortRef = useRef<AbortController | null>(null);

  // -------------------------------------------------------------------------
  // Fetch resume on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadResume() {
      try {
        const supabase = createClient();
        const { data, error: dbError } = await supabase
          .from("resumes")
          .select("id, original_filename, parsed_data, created_at")
          .eq("id", resumeId)
          .single();

        if (dbError || !data) {
          setError("Resume not found. It may have been deleted.");
          setPageState("error");
          return;
        }

        setResume(data as ResumeData);
        setPageState("idle");
      } catch {
        setError("Failed to load resume data.");
        setPageState("error");
      }
    }

    if (resumeId) {
      loadResume();
    }
  }, [resumeId]);

  // -------------------------------------------------------------------------
  // Cleanup abort on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Analyze & Tailor (SSE stream)
  // -------------------------------------------------------------------------

  async function handleAnalyze() {
    if (!jobDescription.trim()) return;

    setPageState("generating");
    setStreamText("");
    setResult(null);
    setDecisions({});
    setCoverLetter("");
    setTailoredResumeId(null);
    setError("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescription }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server error (${res.status})`
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.done) {
              if (parsed.tailoredResumeId) {
                setTailoredResumeId(parsed.tailoredResumeId);
              }
              // Parse the complete accumulated response
              const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const tailorResult: TailorResult = JSON.parse(jsonMatch[0]);
                setResult(tailorResult);
                setPageState("results");
              } else {
                throw new Error("Failed to parse analysis results.");
              }
              break;
            }

            if (parsed.text) {
              accumulated += parsed.text;
              setStreamText(accumulated);
            }
          } catch (parseErr) {
            // JSON parse error on a single line is okay, we might have
            // partial data. Only throw if it is a meaningful error.
            if (
              parseErr instanceof Error &&
              parseErr.message !== "Failed to parse analysis results." &&
              !parseErr.message.startsWith("Unexpected")
            ) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPageState("error");
    }
  }

  // -------------------------------------------------------------------------
  // Accept / Reject Suggestions
  // -------------------------------------------------------------------------

  const handleAccept = useCallback((id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: "accepted" }));
  }, []);

  const handleReject = useCallback((id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: "rejected" }));
  }, []);

  // Compute dynamic match score based on accepted suggestions
  const dynamicScore = (() => {
    if (!result) return 0;
    const baseScore = result.match_score;
    const totalSuggestions = result.suggestions.length;
    if (totalSuggestions === 0) return baseScore;

    const acceptedCount = Object.values(decisions).filter(
      (d) => d === "accepted"
    ).length;
    const maxBoost = 100 - baseScore;
    const boost = (acceptedCount / totalSuggestions) * maxBoost;
    return Math.round(baseScore + boost);
  })();

  const acceptedCount = Object.values(decisions).filter(
    (d) => d === "accepted"
  ).length;

  // -------------------------------------------------------------------------
  // Cover Letter Generation (SSE stream)
  // -------------------------------------------------------------------------

  async function handleGenerateCoverLetter() {
    if (!tailoredResumeId) return;

    setCoverLetterLoading(true);
    setCoverLetter("");
    setCoverLetterCopied(false);

    try {
      const res = await fetch("/api/resume/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailoredResumeId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate cover letter");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.done) break;
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setCoverLetter(accumulated);
            }
          } catch {
            // skip parse errors on partial chunks
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cover letter generation failed"
      );
    } finally {
      setCoverLetterLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Copy Cover Letter
  // -------------------------------------------------------------------------

  async function handleCopyCoverLetter() {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCoverLetterCopied(true);
      setTimeout(() => setCoverLetterCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  // -------------------------------------------------------------------------
  // PDF Download
  // -------------------------------------------------------------------------

  async function handleDownloadPdf() {
    if (!tailoredResumeId) return;
    setPdfDownloading(true);

    try {
      const res = await fetch("/api/resume/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailoredResumeId,
          acceptedSuggestionIds: Object.entries(decisions)
            .filter(([, v]) => v === "accepted")
            .map(([k]) => k),
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume?.original_filename?.replace(/\.[^.]+$/, "")}_tailored.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setPdfDownloading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading resume...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state (fatal — resume not found)
  // -------------------------------------------------------------------------

  if (pageState === "error" && !resume) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Resume
          </h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main Layout
  // -------------------------------------------------------------------------

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* ================================================================= */}
      {/* TOP BAR                                                           */}
      {/* ================================================================= */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Back to dashboard"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {resume?.original_filename || "Resume"}
            </h1>
            {result?.jd_analysis && (
              <p className="text-xs text-gray-400">
                Tailoring for{" "}
                <span className="text-gray-600">
                  {result.jd_analysis.job_title}
                </span>
                {result.jd_analysis.company &&
                  ` at ${result.jd_analysis.company}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Match Score */}
          {(pageState === "results" || result) && (
            <div className="flex items-center gap-2">
              <CircularProgress score={dynamicScore} />
              <div className="hidden sm:block">
                <p className="text-xs text-gray-400">Match Score</p>
                <p className="text-xs text-gray-600">
                  {acceptedCount}/{result?.suggestions.length || 0} accepted
                </p>
              </div>
            </div>
          )}

          {/* Download PDF */}
          {tailoredResumeId && (
            <button
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pdfDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* SPLIT SCREEN BODY                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* ------------------------------------------------------------- */}
        {/* LEFT PANEL: JD Input + Skill Gaps + Keywords                   */}
        {/* ------------------------------------------------------------- */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-6 space-y-6">
            {/* JD Input */}
            <div>
              <label
                htmlFor="jd-input"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Job Description
              </label>
              <textarea
                id="jd-input"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y bg-white"
                disabled={pageState === "generating"}
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  {jobDescription.length > 0
                    ? `${jobDescription.split(/\s+/).filter(Boolean).length} words`
                    : "Paste a job description to get started"}
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={
                    !jobDescription.trim() || pageState === "generating"
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pageState === "generating" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Analyze &amp; Tailor
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inline error (non-fatal) */}
            {error && resume && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p>{error}</p>
                  <button
                    onClick={() => setError("")}
                    className="text-xs text-red-500 hover:underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Idle prompt */}
            {pageState === "idle" && !result && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-200 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <p className="text-gray-500 text-sm">
                  Paste a job description above and click{" "}
                  <span className="font-medium text-gray-700">
                    Analyze &amp; Tailor
                  </span>{" "}
                  to get AI-powered suggestions.
                </p>
              </div>
            )}

            {/* Generating state */}
            {pageState === "generating" && (
              <div>
                <StreamingLoader text="Analyzing job description and generating tailored suggestions..." />
                {streamText && (
                  <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-1">
                      Raw stream output:
                    </p>
                    <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono break-all">
                      {streamText.slice(-500)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Results: Skill Gap */}
            {result?.skill_gap && (
              <SkillGapPanel skillGap={result.skill_gap} />
            )}

            {/* Results: Keyword Chips */}
            {result?.keyword_matches && (
              <KeywordChips keywords={result.keyword_matches} />
            )}

            {/* JD Analysis Summary */}
            {result?.jd_analysis && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  JD Summary
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm space-y-2">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 shrink-0">Role:</span>
                    <span className="text-gray-900">
                      {result.jd_analysis.job_title}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 shrink-0">
                      Company:
                    </span>
                    <span className="text-gray-900">
                      {result.jd_analysis.company || "Not specified"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 shrink-0">
                      Experience:
                    </span>
                    <span className="text-gray-900">
                      {result.jd_analysis.experience_years || "Not specified"}
                    </span>
                  </div>
                  {result.jd_analysis.required_skills.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-24 shrink-0">
                        Required:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {result.jd_analysis.required_skills.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.jd_analysis.preferred_skills.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-24 shrink-0">
                        Preferred:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {result.jd_analysis.preferred_skills.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT PANEL: Suggestions / Cover Letter                        */}
        {/* ------------------------------------------------------------- */}
        <div className="w-1/2 overflow-y-auto bg-white">
          {/* Tab Toggle */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 pt-4 pb-0 z-10">
            <div className="flex gap-0">
              <button
                onClick={() => setRightTab("resume")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  rightTab === "resume"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Resume
                {result && (
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {result.suggestions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightTab("cover-letter")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  rightTab === "cover-letter"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Cover Letter
                {coverLetter && (
                  <span className="ml-1.5 w-2 h-2 bg-green-500 rounded-full inline-block" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* --------------------------------------------------------- */}
            {/* Resume Tab                                                 */}
            {/* --------------------------------------------------------- */}
            {rightTab === "resume" && (
              <>
                {/* No results yet */}
                {!result && pageState !== "generating" && (
                  <div className="text-center py-20">
                    <svg
                      className="w-16 h-16 text-gray-200 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-400 text-sm">
                      Suggestions will appear here after analysis.
                    </p>
                  </div>
                )}

                {/* Generating */}
                {pageState === "generating" && (
                  <StreamingLoader text="Generating tailored suggestions..." />
                )}

                {/* Results: Suggestions List */}
                {result && result.suggestions.length > 0 && (
                  <div className="space-y-4">
                    {/* Bulk actions */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {result.suggestions.length} suggestion
                        {result.suggestions.length !== 1 ? "s" : ""}{" "}
                        <span className="text-gray-400">
                          ({acceptedCount} accepted,{" "}
                          {
                            Object.values(decisions).filter(
                              (d) => d === "rejected"
                            ).length
                          }{" "}
                          rejected)
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const all: Record<string, "accepted"> = {};
                            result.suggestions.forEach(
                              (s) => (all[s.id] = "accepted")
                            );
                            setDecisions(all);
                          }}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Accept All
                        </button>
                        <button
                          onClick={() => setDecisions({})}
                          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Sorted by priority: critical first */}
                    {(["critical", "recommended", "optional"] as const).map(
                      (priority) => {
                        const filtered = result.suggestions.filter(
                          (s) => s.priority === priority
                        );
                        if (filtered.length === 0) return null;
                        return (
                          <div key={priority}>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                              {priority} ({filtered.length})
                            </h3>
                            <div className="space-y-3">
                              {filtered.map((s) => (
                                <SuggestionCard
                                  key={s.id}
                                  suggestion={s}
                                  status={decisions[s.id] || "pending"}
                                  onAccept={() => handleAccept(s.id)}
                                  onReject={() => handleReject(s.id)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {/* Results: No suggestions */}
                {result && result.suggestions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">
                      No suggestions generated. Your resume may already be well
                      tailored for this role.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* --------------------------------------------------------- */}
            {/* Cover Letter Tab                                           */}
            {/* --------------------------------------------------------- */}
            {rightTab === "cover-letter" && (
              <>
                {!tailoredResumeId && (
                  <div className="text-center py-20">
                    <svg
                      className="w-16 h-16 text-gray-200 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-400 text-sm">
                      Run an analysis first to generate a cover letter.
                    </p>
                  </div>
                )}

                {tailoredResumeId && !coverLetter && !coverLetterLoading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-sm mb-4">
                      Generate a tailored cover letter based on your resume and
                      the job description.
                    </p>
                    <button
                      onClick={handleGenerateCoverLetter}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Generate Cover Letter
                    </button>
                  </div>
                )}

                {coverLetterLoading && (
                  <div>
                    <StreamingLoader text="Writing your cover letter..." />
                    {coverLetter && (
                      <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-6">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {coverLetter}
                          <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {coverLetter && !coverLetterLoading && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Your Cover Letter
                      </h3>
                      <button
                        onClick={handleCopyCoverLetter}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {coverLetterCopied ? (
                          <>
                            <svg
                              className="w-3.5 h-3.5 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {coverLetter}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateCoverLetter}
                      className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
