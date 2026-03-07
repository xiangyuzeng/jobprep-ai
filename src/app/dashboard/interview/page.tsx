"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateBrowser from "@/components/interview/TemplateBrowser";
import { ROUND_CONFIGS, getRoundConfig } from "@/lib/round-config";

export default function InterviewBoardCreatePage() {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [roundType, setRoundType] = useState("technical");
  const [language, setLanguage] = useState("en");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewerInfo, setInterviewerInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          role,
          roundType,
          language,
          jobDescription: jobDescription || undefined,
          interviewerInfo: interviewerInfo || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create board");
      }

      const { boardId } = await res.json();
      router.push(`/dashboard/interview/${boardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board");
      setLoading(false);
    }
  }

  async function handleSelectTemplate(templateId: string) {
    setTemplateLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load template");
      }
      const { boardId } = await res.json();
      router.push(`/dashboard/interview/${boardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template");
      setTemplateLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px" }}>
      {/* Template Browser Section */}
      <TemplateBrowser
        onSelectTemplate={handleSelectTemplate}
        loading={templateLoading}
      />

      {/* Separator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        margin: "32px 0 24px", color: "#bbb", fontSize: 13,
      }}>
        <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
        <span>or create a custom board</span>
        <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
      </div>

      {/* Custom Create Form */}
      <h2 style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontSize: 18, fontWeight: 700, color: "var(--ink-black)",
        marginBottom: 4,
      }}>
        Custom Interview Board
      </h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        AI will generate 40-80 interview questions with detailed answers,
        organized by topic for your target role.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[var(--vermillion)] focus:border-transparent outline-none"
              placeholder="e.g., Google"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role / Title *
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[var(--vermillion)] focus:border-transparent outline-none"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
        </div>

        {/* Visual Round Type Cards */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interview Round *
          </label>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 8,
          }}>
            {Object.values(ROUND_CONFIGS).map((cfg) => {
              const isActive = roundType === cfg.id;
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => setRoundType(cfg.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: isActive ? `2px solid var(--vermillion)` : "1px solid #e0e0e0",
                    background: isActive ? cfg.bgColor : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? cfg.color : "var(--ink-dark)" }}>
                    {cfg.icon} {cfg.label}
                  </div>
                  <div style={{
                    fontSize: 11, color: "#888", marginTop: 2,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {cfg.description}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Tips preview for selected round */}
          {(() => {
            const cfg = getRoundConfig(roundType);
            return (
              <div style={{
                marginTop: 8, padding: "8px 12px",
                background: cfg.bgColor, borderRadius: 6,
                fontSize: 11, color: "#666",
              }}>
                <span style={{ fontWeight: 600 }}>Tips: </span>
                {cfg.tips.slice(0, 2).join(" · ")}
              </div>
            );
          })()}
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[var(--vermillion)] focus:border-transparent outline-none bg-white"
          >
            <option value="en">English</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description (optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[var(--vermillion)] focus:border-transparent outline-none resize-y"
            placeholder="Paste the job description here for more targeted questions..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interviewer Info (optional)
          </label>
          <textarea
            value={interviewerInfo}
            onChange={(e) => setInterviewerInfo(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[var(--vermillion)] focus:border-transparent outline-none resize-y"
            placeholder="Name, title, LinkedIn, or any info about the interviewer..."
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--ink-dark)] text-white rounded-sm font-medium hover:bg-[var(--ink-black)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating questions..." : "Generate Interview Board"}
        </button>
      </form>
    </div>
  );
}
