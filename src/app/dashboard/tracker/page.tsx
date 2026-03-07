import { createClient } from "@/lib/supabase/server";
import TrackerBoard from "@/components/tracker/TrackerBoard";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      `*,
      tailored_resume:tailored_resumes(id, company_name, match_score),
      interview_board:interview_boards(id, company_name, role, round_type, status),
      resume:resumes(id, original_filename)`
    )
    .eq("user_id", user!.id)
    .order("position_in_column", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-gray-900">
          Application Tracker
        </h1>
      </div>
      <TrackerBoard initialApplications={applications || []} />
    </div>
  );
}
