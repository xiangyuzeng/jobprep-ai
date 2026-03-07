import { createClient } from "@/lib/supabase/server";
import { getUsage } from "@/lib/usage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getUsage(supabase, user.id);
    return NextResponse.json(usage);
  } catch (err) {
    console.error("Usage fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
