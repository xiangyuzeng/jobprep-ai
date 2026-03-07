"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types (copied from resume/[id]/page.tsx)
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

interface TailorResult {
  jd_analysis: JDAnalysis;
  skill_gap: SkillGap;
  match_score: number;
  suggestions: { id: string; type: string; section: string; original: string; replacement: string; reason: string; priority: string }[];
  keyword_matches: { matched: { keyword: string; locations: string[] }[]; missing: string[] };
}

// ---------------------------------------------------------------------------
// Sample JD (from demo page)
// ---------------------------------------------------------------------------

const SAMPLE_JD = `Software Engineer - Full Stack

About the Role:
We're looking for a Full Stack Software Engineer to join our team. You'll build and maintain web applications using modern technologies, collaborate with cross-functional teams, and contribute to our engineering culture.

Requirements:
- 3+ years of experience with React, TypeScript, and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Strong understanding of RESTful APIs and database design
- Experience with CI/CD pipelines and agile methodologies
- Excellent problem-solving skills and attention to detail

Nice to Have:
- Experience with Next.js or similar frameworks
- Knowledge of microservices architecture
- Experience with PostgreSQL or similar databases
- Contributions to open source projects`;

// ---------------------------------------------------------------------------
// suggestRoundType (from prepare/page.tsx)
// ---------------------------------------------------------------------------

function suggestRoundType(analysis: JDAnalysis): string {
  const title = (analysis.job_title || "").toLowerCase();
  const responsibilities = (analysis.required_skills || []).join(" ").toLowerCase();
  if (title.includes("hr") || title.includes("recruiter")) return "hr";
  if (title.includes("cto") || title.includes("vp") || title.includes("director") || title.includes("head of")) return "ceo";
  if (responsibilities.includes("architecture") || responsibilities.includes("system design") || title.includes("engineer") || title.includes("developer")) return "technical";
  return "general";
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

const STEPS = [
  { num: 1, label: "Upload Resume" },
  { num: 2, label: "Tailor & Analyze" },
  { num: 3, label: "Your Results" },
] as const;

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => (
        <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                background: s.num <= current ? "var(--vermillion)" : "#e8e0d0",
                color: s.num <= current ? "white" : "var(--ink-light)",
                transition: "all 0.3s",
              }}
            >
              {s.num < current ? "\u2713" : s.num}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: s.num === current ? 600 : 400,
                color: s.num === current ? "var(--ink-dark)" : "var(--ink-light)",
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                width: 60,
                height: 2,
                background: s.num < current ? "var(--vermillion)" : "#e8e0d0",
                margin: "0 8px",
                marginBottom: 20,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OnboardingWizard
// ---------------------------------------------------------------------------

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Step 2 state
  const [jobDescription, setJobDescription] = useState(SAMPLE_JD);
  const [tailoring, setTailoring] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [tailoredResumeId, setTailoredResumeId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Step 3 state
  const [boardId, setBoardId] = useState<string | null>(null);
  const [boardGenerating, setBoardGenerating] = useState(false);

  // Shared
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  // -------------------------------------------------------------------------
  // Skip / Complete onboarding
  // -------------------------------------------------------------------------

  async function markComplete() {
    setCompleting(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      router.refresh();
    } catch {
      setCompleting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Step 1: File upload
  // -------------------------------------------------------------------------

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  function validateAndSetFile(f: File) {
    const ext = f.name.toLowerCase().split(".").pop();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }
    setError("");
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { resumeId: id } = await res.json();
      setResumeId(id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Tailor (SSE stream) + fire-and-forget board generation
  // -------------------------------------------------------------------------

  async function handleTailor() {
    if (!resumeId || !jobDescription.trim()) return;

    setTailoring(true);
    setStreamText("");
    setTailorResult(null);
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
        throw new Error(errData.error || `Server error (${res.status})`);
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
              const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const result: TailorResult = JSON.parse(jsonMatch[0]);
                setTailorResult(result);
                setStep(3);

                // Fire-and-forget board generation
                generateBoard(result, jobDescription);
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
    } finally {
      setTailoring(false);
    }
  }

  async function generateBoard(result: TailorResult, jd: string) {
    setBoardGenerating(true);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: result.jd_analysis.company || "Company",
          role: result.jd_analysis.job_title || "Role",
          roundType: suggestRoundType(result.jd_analysis),
          jobDescription: jd,
        }),
      });

      if (res.ok) {
        const { boardId: id } = await res.json();
        setBoardId(id);
      }
    } catch {
      // Board generation is optional — don't block step 3
    } finally {
      setBoardGenerating(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Extract top 3 missing skills for step 3
  const missingSkills: string[] = [];
  if (tailorResult) {
    const allGaps = [
      ...(tailorResult.skill_gap.critical || []),
      ...(tailorResult.skill_gap.recommended || []),
      ...(tailorResult.skill_gap.optional || []),
    ];
    const missing = allGaps.filter((g) => g.status === "missing" || g.status === "strengthen");
    missingSkills.push(...missing.slice(0, 3).map((g) => g.skill));
  }

  const matchScore = tailorResult?.match_score ?? 0;
  const scoreColor = matchScore >= 70 ? "#2d6a4f" : matchScore >= 50 ? "var(--gold-accent)" : "var(--vermillion)";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Header with skip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div />
        <button
          onClick={markComplete}
          disabled={completing}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-light)",
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            padding: "4px 8px",
          }}
        >
          {completing ? "Skipping..." : "Skip setup"}
        </button>
      </div>

      <Stepper current={step} />

      {error && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#fdf2f0",
            border: "1px solid #f5c6c2",
            color: "#c23616",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 1: Upload Resume */}
      {/* ================================================================= */}
      {step === 1 && (
        <div>
          <h2
            className="font-cinzel"
            style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-dark)", textAlign: "center", marginBottom: 4 }}
          >
            Welcome to JobPrep AI
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-mid)", textAlign: "center", marginBottom: 24 }}>
            Let&apos;s get you interview-ready in 3 steps. Start by uploading your resume.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? "var(--vermillion)" : file ? "#4ade80" : "#d4c9b5"}`,
              borderRadius: 8,
              padding: 48,
              textAlign: "center",
              background: dragActive ? "var(--paper-cream)" : file ? "#f0fdf4" : "white",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            {file ? (
              <div>
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="#4ade80" viewBox="0 0 24 24" style={{ width: 48, height: 48 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p style={{ fontWeight: 600, color: "var(--ink-dark)" }}>{file.name}</p>
                <p style={{ fontSize: 13, color: "var(--ink-light)", marginTop: 4 }}>
                  {(file.size / 1024).toFixed(0)} KB
                </p>
                <button
                  onClick={() => setFile(null)}
                  style={{ fontSize: 13, color: "var(--vermillion)", background: "none", border: "none", cursor: "pointer", marginTop: 8, textDecoration: "underline" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg style={{ width: 48, height: 48, margin: "0 auto 12px", color: "#d4c9b5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{ color: "var(--ink-mid)", marginBottom: 4 }}>
                  Drag and drop your resume here, or
                </p>
                <label style={{ color: "var(--vermillion)", fontWeight: 600, cursor: "pointer" }}>
                  browse files
                  <input
                    type="file"
                    style={{ display: "none" }}
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) validateAndSetFile(f);
                    }}
                  />
                </label>
                <p style={{ fontSize: 12, color: "var(--ink-light)", marginTop: 8 }}>PDF or DOCX, up to 10MB</p>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "14px 0",
                background: uploading ? "#b0a08a" : "var(--vermillion)",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 15,
                cursor: uploading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {uploading ? "Parsing resume..." : "Upload & Continue"}
            </button>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 2: Paste JD & Tailor */}
      {/* ================================================================= */}
      {step === 2 && (
        <div>
          <h2
            className="font-cinzel"
            style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-dark)", textAlign: "center", marginBottom: 4 }}
          >
            Paste the Job Description
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-mid)", textAlign: "center", marginBottom: 20 }}>
            We&apos;ll analyze the role and tailor your resume to match.
          </p>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={tailoring}
            rows={12}
            style={{
              width: "100%",
              padding: 16,
              border: "1px solid #d4c9b5",
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.6,
              resize: "vertical",
              fontFamily: "inherit",
              background: tailoring ? "#f9f6f0" : "white",
              color: "var(--ink-dark)",
            }}
            placeholder="Paste the full job description here..."
          />

          {/* Streaming progress */}
          {tailoring && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 8,
                background: "#f9f6f0",
                border: "1px solid #e8e0d0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid var(--vermillion)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dark)" }}>
                  Analyzing & tailoring...
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-light)" }}>
                This may take 10–15 seconds.
              </p>
            </div>
          )}

          <button
            onClick={handleTailor}
            disabled={tailoring || !jobDescription.trim()}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "14px 0",
              background: tailoring || !jobDescription.trim() ? "#b0a08a" : "var(--vermillion)",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 15,
              cursor: tailoring || !jobDescription.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {tailoring ? "Analyzing..." : "Analyze & Tailor"}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 3: Results */}
      {/* ================================================================= */}
      {step === 3 && tailorResult && (
        <div>
          <h2
            className="font-cinzel"
            style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-dark)", textAlign: "center", marginBottom: 4 }}
          >
            You&apos;re Ready to Practice!
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-mid)", textAlign: "center", marginBottom: 24 }}>
            Here&apos;s how your resume matches the role.
          </p>

          {/* Match score */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: `4px solid ${scoreColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                background: "white",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor }}>
                {matchScore}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "var(--ink-mid)" }}>Match Score</span>
          </div>

          {/* Skill gaps */}
          {missingSkills.length > 0 && (
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-mid)", marginBottom: 8 }}>
                Key Areas to Strengthen
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {missingSkills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 500,
                      background: "#fef3c7",
                      color: "#92400e",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {/* Tailored Resume card */}
            <Link
              href={`/dashboard/resume/${resumeId}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 20,
                borderRadius: 8,
                border: "1px solid #d4c9b5",
                background: "white",
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
            >
              <svg style={{ width: 32, height: 32, marginBottom: 8, color: "var(--vermillion)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dark)" }}>View Tailored Resume</span>
              <span style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 2 }}>Review AI suggestions</span>
            </Link>

            {/* Interview Board card */}
            {boardId ? (
              <Link
                href={`/dashboard/interview/${boardId}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 20,
                  borderRadius: 8,
                  border: "1px solid #d4c9b5",
                  background: "white",
                  textDecoration: "none",
                  transition: "border-color 0.2s",
                }}
              >
                <svg style={{ width: 32, height: 32, marginBottom: 8, color: "#2d6a4f" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dark)" }}>Practice Questions</span>
                <span style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 2 }}>40+ tailored questions</span>
              </Link>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                  borderRadius: 8,
                  border: "1px solid #e8e0d0",
                  background: "#f9f6f0",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: "2px solid var(--ink-light)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginBottom: 8,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-mid)" }}>
                  {boardGenerating ? "Generating board..." : "Preparing questions..."}
                </span>
              </div>
            )}
          </div>

          {/* Complete button */}
          <button
            onClick={markComplete}
            disabled={completing}
            style={{
              width: "100%",
              padding: "14px 0",
              background: completing ? "#b0a08a" : "var(--ink-dark)",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 15,
              cursor: completing ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {completing ? "Loading..." : "Explore Dashboard"}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
