import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateAnkiExport } from "@/lib/anki-export";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: board } = await supabase
      .from("interview_boards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const tsv = generateAnkiExport(board);
    const filename = `${board.company_name}_${board.role}_flashcards.txt`.replace(
      /\s+/g,
      "_"
    );

    return new Response(tsv, {
      headers: {
        "Content-Type": "text/tab-separated-values",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Anki export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
