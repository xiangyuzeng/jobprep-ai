import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: boardId } = await params;

    const { data: progress } = await supabase
      .from("board_progress")
      .select("completed_cards")
      .eq("board_id", boardId)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      completedCards: progress?.completed_cards || [],
    });
  } catch (err) {
    console.error("Progress fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: boardId } = await params;
    const { completedCards } = await request.json();

    // Upsert progress
    const { error: dbError } = await supabase
      .from("board_progress")
      .upsert(
        {
          user_id: user.id,
          board_id: boardId,
          completed_cards: completedCards,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,board_id",
        }
      );

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Progress update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
