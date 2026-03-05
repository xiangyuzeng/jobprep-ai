"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewBoardCreatePage() {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [roundType, setRoundType] = useState("technical");
  const [language, setLanguage] = useState("en");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewerInfo, setInterviewerInfo] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Create Interview Board
      </h1>
      <p className="text-gray-500 mb-8">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Round *
            </label>
            <select
              value={roundType}
              onChange={(e) => setRoundType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
            >
              <option value="technical">Technical (CTO / Engineering Manager)</option>
              <option value="hr">HR / Recruiter</option>
              <option value="ceo">CEO / Executive</option>
              <option value="general">General / Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
            >
              <option value="en">English</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description (optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
            placeholder="Name, title, LinkedIn, or any info about the interviewer..."
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating questions..." : "Generate Interview Board"}
        </button>
      </form>
    </div>
  );
}
