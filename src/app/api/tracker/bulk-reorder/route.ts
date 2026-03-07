import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { updates } = body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates array is required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  for (const item of updates) {
    const updateData: Record<string, unknown> = {
      position_in_column: item.position_in_column,
      updated_at: now,
    };

    if (item.status) {
      updateData.status = item.status;
    }

    await supabase
      .from("job_applications")
      .update(updateData)
      .eq("id", item.id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
