import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service client to bypass RLS for tier update
    const serviceClient = await createServiceClient();
    await serviceClient
      .from("profiles")
      .update({ tier: "pro", tier_updated_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ success: true, tier: "pro" });
  } catch (err) {
    console.error("Demo upgrade error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
