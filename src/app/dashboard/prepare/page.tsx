"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DossierCard from "@/components/dossier/DossierCard";
import DossierLoadingState from "@/components/dossier/DossierLoadingState";
import type { CompanyDossier } from "@/lib/dossier";

interface JDAnalysis {
  job_title: string;
  company: string;
  required_skills: string[];
  preferred_skills: string[];
  keywords: string[];
  experience_years: string;
  education_requirements: string;
  key_responsibilities: string[];
  culture_indicators: string[];
}

type PageState = "idle" | "analyzing" | "analyzed" | "researching" | "generating";

function suggestRoundType(analysis: JDAnalysis): string {
  const title = (analysis.job_title || "").toLowerCase();
  const responsibilities = (analysis.key_responsibilities || []).join(" ").toLowerCase();
  if (title.includes("hr") || title.includes("recruiter")) return "hr";
  if (title.includes("cto") || title.includes("vp") || title.includes("director") || title.includes("head of")) return "ceo";
  if (responsibilities.includes("architecture") || responsibilities.includes("system design") || title.includes("engineer") || title.includes("developer")) return "technical";
  return "general";
}

export default function PreparePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("idle");
  const [jdText, setJdText] = useState("");
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [roundType, setRoundType] = useState("general");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [dossier, setDossier] = useState<CompanyDossier | null>(null);
  const [dossierError, setDossierError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleResearch = async (analysisOverride?: JDAnalysis) => {
    const currentAnalysis = analysisOverride || analysis;
    if (!currentAnalysis?.company) return;

    setDossierError("");

    try {
      const res = await fetch("/api/dossier/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: currentAnalysis.company,
          jobDescription: jdText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Research failed");
      }

      const { dossier: result } = await res.json();
      if (result) {
        setDossier(result);
      } else {
        setDossierError("Could not gather company intel. You can still generate the board.");
      }
    } catch (err) {
      setDossierError(
        err instanceof Error ? err.message : "Company research failed"
      );
    } finally {
      setPageState("analyzed");
    }
  };

  const handleAnalyze = async () => {
    if (jdText.trim().length < 50) {
      setError("Please paste a longer job description (at least 50 characters).");
      return;
    }

    setError("");
    setPageState("analyzing");

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/prepare/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jdText }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) fullText += parsed.text;
            } catch {
              // skip parse errors
            }
          }
        }
      }

      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse analysis results");

      const parsed: JDAnalysis = JSON.parse(jsonMatch[0]);
      setAnalysis(parsed);
      setRoundType(suggestRoundType(parsed));

      // Auto-trigger company research if company name found
      if (parsed.company) {
        setPageState("researching");
        handleResearch(parsed);
      } else {
        setPageState("analyzed");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPageState("idle");
    }
  };

  const handleGenerate = async () => {
    if (!analysis) return;

    setPageState("generating");
    setError("");

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: analysis.company || "Unknown Company",
          role: analysis.job_title || "Unknown Role",
          roundType,
          language,
          jobDescription: jdText,
          sourceType: "jd_prepare",
          dossier: dossier || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Board generation failed");
      }

      const { boardId } = await res.json();
      router.push(`/dashboard/interview/${boardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate board");
      setPageState("analyzed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-cinzel">Quick Prepare</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a job description to instantly generate a tailored interview board.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Paste JD */}
      {(pageState === "idle" || pageState === "analyzing") && (
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-64 border border-gray-300 rounded-sm p-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--vermillion)] focus:border-transparent"
            disabled={pageState === "analyzing"}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">
              {jdText.length} characters
            </span>
            <button
              onClick={handleAnalyze}
              disabled={pageState === "analyzing" || jdText.trim().length < 50}
              className="bg-[var(--gold-accent)] text-white px-6 py-2 rounded-sm text-sm font-medium hover:bg-[#b89840] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {pageState === "analyzing" ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Analyze JD"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review Analysis */}
      {(pageState === "analyzed" || pageState === "researching" || pageState === "generating") && analysis && (
        <div className="space-y-4">
          {/* Analysis Results */}
          <div className="bg-white rounded-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">JD Analysis</h2>
              <button
                onClick={() => {
                  setPageState("idle");
                  setAnalysis(null);
                  setDossier(null);
                  setDossierError("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Start Over
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Job Title
                </span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {analysis.job_title || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Company
                </span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {analysis.company || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Experience
                </span>
                <p className="text-sm text-gray-700 mt-0.5">
                  {analysis.experience_years || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Education
                </span>
                <p className="text-sm text-gray-700 mt-0.5">
                  {analysis.education_requirements || "Not specified"}
                </p>
              </div>
            </div>

            {/* Required Skills */}
            {analysis.required_skills?.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Required Skills
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {analysis.required_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Skills */}
            {analysis.preferred_skills?.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Preferred Skills
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {analysis.preferred_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-[#fdf2f0] text-blue-700 px-2 py-0.5 rounded-full border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Responsibilities */}
            {analysis.key_responsibilities?.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Key Responsibilities
                </span>
                <ul className="mt-1.5 space-y-1">
                  {analysis.key_responsibilities.map((resp, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">{"\u2022"}</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Keywords */}
            {analysis.keywords?.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Keywords
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {analysis.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dossier Section */}
          {pageState === "researching" && analysis.company && (
            <DossierLoadingState companyName={analysis.company} />
          )}

          {dossier && pageState !== "researching" && (
            <DossierCard dossier={dossier} />
          )}

          {dossierError && pageState !== "researching" && (
            <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-sm text-sm text-yellow-700">
              {dossierError}
            </div>
          )}

          {/* Manual research button if no dossier and analysis has company */}
          {!dossier && !dossierError && pageState === "analyzed" && analysis.company && (
            <button
              onClick={() => {
                setPageState("researching");
                handleResearch();
              }}
              className="w-full py-2 text-sm text-[var(--gold-accent)] border border-[var(--gold-accent)] rounded-sm hover:bg-[var(--gold-accent)] hover:text-white transition-colors"
            >
              {"\u{1F50D}"} Research {analysis.company}
            </button>
          )}

          {/* Board Configuration */}
          <div className="bg-white rounded-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Interview Board Settings
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Round Type
                </label>
                <select
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--vermillion)]"
                  disabled={pageState === "generating" || pageState === "researching"}
                >
                  <option value="technical">Technical</option>
                  <option value="hr">HR / Recruiter</option>
                  <option value="ceo">CEO / Leadership</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--vermillion)]"
                  disabled={pageState === "generating" || pageState === "researching"}
                >
                  <option value="en">English</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={pageState === "generating" || pageState === "researching"}
              className="mt-4 w-full bg-[var(--gold-accent)] text-white py-2.5 rounded-sm text-sm font-medium hover:bg-[#b89840] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pageState === "generating" ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating Interview Board...
                </>
              ) : (
                "Generate Interview Board"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
