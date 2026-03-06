import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, original_filename, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: boards } = await supabase
    .from("interview_boards")
    .select("id, company_name, role, round_type, status, total_questions, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/resume"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            New Resume
          </Link>
          <Link
            href="/dashboard/prepare"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Quick Prepare
          </Link>
          <Link
            href="/dashboard/interview"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            New Interview Board
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Resumes Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Resumes
          </h2>
          {resumes && resumes.length > 0 ? (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <Link
                  key={resume.id}
                  href={`/dashboard/resume/${resume.id}`}
                  className="block bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {resume.original_filename}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 border border-dashed border-gray-300 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm mb-3">
                No resumes yet. Upload your first resume to get started.
              </p>
              <Link
                href="/dashboard/resume"
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                Upload Resume
              </Link>
            </div>
          )}
        </div>

        {/* Interview Boards Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Interview Boards
          </h2>
          {boards && boards.length > 0 ? (
            <div className="space-y-3">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/dashboard/interview/${board.id}`}
                  className="block bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">
                        {board.company_name} — {board.role}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
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
                    <span className="text-xs text-gray-400">
                      {new Date(board.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 border border-dashed border-gray-300 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-gray-500 text-sm mb-3">
                No interview boards yet. Create one for your next interview.
              </p>
              <Link
                href="/dashboard/interview"
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                Create Interview Board
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
