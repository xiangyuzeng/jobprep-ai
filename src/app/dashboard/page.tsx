import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

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
        <h1 className="font-cinzel text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/resume"
            className="bg-[var(--vermillion)] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[var(--vermillion-dark)] transition-colors"
          >
            New Resume
          </Link>
          <Link
            href="/dashboard/prepare"
            className="bg-[var(--gold-accent)] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#b89840] transition-colors"
          >
            Quick Prepare
          </Link>
          <Link
            href="/dashboard/interview"
            className="bg-[var(--ink-dark)] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[var(--ink-black)] transition-colors"
          >
            New Interview Board
          </Link>
        </div>
      </div>

      <DashboardClient
        initialResumes={resumes || []}
        initialBoards={boards || []}
      />
    </div>
  );
}
