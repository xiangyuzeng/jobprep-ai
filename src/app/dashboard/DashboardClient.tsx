"use client";

import { useState } from "react";
import Link from "next/link";

interface Resume {
  id: string;
  original_filename: string;
  created_at: string;
}

interface Board {
  id: string;
  company_name: string;
  role: string;
  round_type: string;
  status: string;
  total_questions: number;
  created_at: string;
}

interface Props {
  initialResumes: Resume[];
  initialBoards: Board[];
}

export default function DashboardClient({ initialResumes, initialBoards }: Props) {
  const [resumes, setResumes] = useState(initialResumes);
  const [boards, setBoards] = useState(initialBoards);

  const handleDeleteResume = async (e: React.MouseEvent, resume: Resume) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${resume.original_filename}"? This will also remove all tailored versions. This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/resume/${resume.id}`, { method: "DELETE" });
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== resume.id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete resume");
      }
    } catch {
      alert("Failed to delete resume");
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, board: Board) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${board.company_name} — ${board.role}" board? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/interview/${board.id}`, { method: "DELETE" });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b.id !== board.id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete board");
      }
    } catch {
      alert("Failed to delete board");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Resumes Section */}
      <div>
        <h2 className="font-cinzel text-lg font-semibold text-gray-900 mb-4">
          Your Resumes
        </h2>
        {resumes.length > 0 ? (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div key={resume.id} className="relative group">
                <Link
                  href={`/dashboard/resume/${resume.id}`}
                  className="block bg-white rounded-sm p-4 border border-gray-200 border-l-2 border-l-[var(--vermillion)] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#fbe4df] rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-[var(--vermillion)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {resume.original_filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDeleteResume(e, resume)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                        title="Delete resume"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-sm p-8 border border-dashed border-gray-300 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm mb-3">
              No resumes yet. Upload your first resume to get started.
            </p>
            <Link
              href="/dashboard/resume"
              className="text-[var(--vermillion)] text-sm font-medium hover:underline"
            >
              Upload Resume
            </Link>
          </div>
        )}
      </div>

      {/* Interview Boards Section */}
      <div>
        <h2 className="font-cinzel text-lg font-semibold text-gray-900 mb-4">
          Interview Boards
        </h2>
        {boards.length > 0 ? (
          <div className="space-y-3">
            {boards.map((board) => (
              <div key={board.id} className="relative group">
                <Link
                  href={`/dashboard/interview/${board.id}`}
                  className="block bg-white rounded-sm p-4 border border-gray-200 border-l-2 border-l-[var(--ink-dark)] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">
                        {board.company_name} — {board.role}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-[#e8e4df] text-[var(--ink-black)] px-2 py-0.5 rounded-full capitalize">
                          {board.round_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {board.total_questions || "?"} questions
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            board.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {board.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(board.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDeleteBoard(e, board)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                        title="Delete board"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-sm p-8 border border-dashed border-gray-300 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-500 text-sm mb-3">
              No interview boards yet. Create one for your next interview.
            </p>
            <Link
              href="/dashboard/interview"
              className="text-[var(--ink-dark)] text-sm font-medium hover:underline"
            >
              Create Interview Board
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
