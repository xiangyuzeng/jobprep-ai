import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SessionReviewClient from "./SessionReviewClient";

export const dynamic = "force-dynamic";

export default async function SessionReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { sessionId } = await params;

  // Fetch session
  const { data: session } = await supabase
    .from("simulator_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    redirect("/dashboard/simulator");
  }

  // Fetch all answers for this session
  const { data: dbAnswers } = await supabase
    .from("simulator_answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("question_index", { ascending: true });

  return (
    <SessionReviewClient
      session={session}
      dbAnswers={dbAnswers || []}
    />
  );
}
