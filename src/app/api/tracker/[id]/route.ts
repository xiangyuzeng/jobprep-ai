import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const stringFields = [
    "company_name",
    "job_title",
    "job_url",
    "job_description",
    "status",
    "salary_range",
    "notes",
    "contact_name",
    "contact_email",
  ];
  for (const field of stringFields) {
    if (typeof body[field] === "string") {
      updates[field] = body[field];
    }
  }

  const dateFields = ["applied_at", "interview_date", "offer_deadline"];
  for (const field of dateFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (typeof body.position_in_column === "number") {
    updates.position_in_column = body.position_in_column;
  }

  const uuidFields = ["tailored_resume_id", "board_id", "resume_id"];
  for (const field of uuidFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Auto-set applied_at when status changes to "applied" and applied_at not already set
  if (updates.status === "applied" && !body.applied_at) {
    // Check if applied_at is already set on the record
    const { data: existing } = await supabase
      .from("job_applications")
      .select("applied_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existing && !existing.applied_at) {
      updates.applied_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("job_applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
