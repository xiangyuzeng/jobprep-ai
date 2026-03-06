import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SimulatorPageClient from "./SimulatorPageClient";

export const dynamic = "force-dynamic";

export default async function SimulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;

  // Fetch completed interview boards with modules for question pool
  const { data: boards } = await supabase
    .from("interview_boards")
    .select("id, company_name, role, round_type, modules, status")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Fetch past simulator sessions
  const { data: sessions } = await supabase
    .from("simulator_sessions")
    .select(
      "id, company_name, role, round_type, interviewer_mode, status, overall_score, question_count, created_at, completed_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <SimulatorPageClient
      boards={boards || []}
      pastSessions={sessions || []}
      preselectedBoardId={params.boardId}
    />
  );
}
