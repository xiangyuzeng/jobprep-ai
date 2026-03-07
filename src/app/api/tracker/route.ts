import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `*,
      tailored_resume:tailored_resumes(id, company_name, match_score),
      interview_board:interview_boards(id, company_name, role, round_type, status),
      resume:resumes(id, original_filename)`
    )
    .eq("user_id", user.id)
    .order("position_in_column", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { company_name, job_title } = body;

  if (!company_name?.trim() || !job_title?.trim()) {
    return NextResponse.json({ error: "company_name and job_title are required" }, { status: 400 });
  }

  const status = body.status || "saved";

  // Get next position in target column
  const { data: maxPos } = await supabase
    .from("job_applications")
    .select("position_in_column")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("position_in_column", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxPos?.position_in_column ?? -1) + 1;

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    company_name: company_name.trim(),
    job_title: job_title.trim(),
    status,
    position_in_column: nextPosition,
  };

  if (body.job_url) insertData.job_url = body.job_url;
  if (body.job_description) insertData.job_description = body.job_description;
  if (body.tailored_resume_id) insertData.tailored_resume_id = body.tailored_resume_id;
  if (body.board_id) insertData.board_id = body.board_id;
  if (body.resume_id) insertData.resume_id = body.resume_id;
  if (body.salary_range) insertData.salary_range = body.salary_range;
  if (body.notes) insertData.notes = body.notes;
  if (body.contact_name) insertData.contact_name = body.contact_name;
  if (body.contact_email) insertData.contact_email = body.contact_email;

  // Auto-set applied_at if status is "applied"
  if (status === "applied") {
    insertData.applied_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("job_applications")
    .insert(insertData)
    .select(
      `*,
      tailored_resume:tailored_resumes(id, company_name, match_score),
      interview_board:interview_boards(id, company_name, role, round_type, status),
      resume:resumes(id, original_filename)`
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}
