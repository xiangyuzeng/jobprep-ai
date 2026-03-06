import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CoachChatPage from "@/components/coach/CoachChatPage";
import type { CoachMode } from "@/types/coach";

export const dynamic = "force-dynamic";

export default async function CoachPage({
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

  // Fetch user's resumes for context picker
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, original_filename")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch user's completed interview boards for context picker
  const { data: boards } = await supabase
    .from("interview_boards")
    .select("id, company_name, role")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Fetch existing coach sessions for sidebar
  const { data: sessions } = await supabase
    .from("coach_sessions")
    .select(
      "id, coach_mode, title, resume_id, tailored_resume_id, board_id, message_count, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  // Parse query params for initial state
  const initialMode = params.mode as CoachMode | undefined;
  const initialBoardId = params.boardId;
  const initialTailoredResumeId = params.tailoredResumeId;
  const initialSessionId = params.sessionId;

  return (
    <CoachChatPage
      resumes={resumes || []}
      boards={boards || []}
      initialSessions={sessions || []}
      initialMode={initialMode}
      initialBoardId={initialBoardId}
      initialTailoredResumeId={initialTailoredResumeId}
      initialSessionId={initialSessionId}
    />
  );
}
