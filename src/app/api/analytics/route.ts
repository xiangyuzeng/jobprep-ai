import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Streak calculation — count consecutive calendar days (UTC) with any activity
// ---------------------------------------------------------------------------

function computeStreak(
  sessions: Array<{ created_at: string; completed_at: string | null }>,
  boardProgress: Array<{ updated_at: string }>,
  coachSessions: Array<{ created_at: string }>
): number {
  const activityDates = new Set<string>();

  for (const s of sessions) {
    activityDates.add(s.created_at.slice(0, 10));
    if (s.completed_at) activityDates.add(s.completed_at.slice(0, 10));
  }
  for (const bp of boardProgress) {
    if (bp.updated_at) activityDates.add(bp.updated_at.slice(0, 10));
  }
  for (const cs of coachSessions) {
    activityDates.add(cs.created_at.slice(0, 10));
  }

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (activityDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// GET /api/analytics
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();

    // Run all queries in parallel
    const [
      { data: sessions },
      { data: boardProgress },
      { data: coachSessions },
      { count: weekSessions },
      { count: weekCoach },
      { data: weekBoardProgress },
    ] = await Promise.all([
      // 1. Completed simulator sessions (score trend + readiness + streak)
      supabase
        .from("simulator_sessions")
        .select(
          "id, company_name, role, board_id, overall_score, content_score, delivery_score, completed_at, created_at"
        )
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: true })
        .limit(50),

      // 2. Board progress with joined interview_boards
      supabase
        .from("board_progress")
        .select(
          "id, completed_cards, updated_at, interview_boards(id, company_name, role, total_questions)"
        )
        .eq("user_id", user.id),

      // 3. Coach sessions (streak)
      supabase
        .from("coach_sessions")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),

      // 4. Week: sessions count
      supabase
        .from("simulator_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", weekAgoISO),

      // 5. Week: coach chats count
      supabase
        .from("coach_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekAgoISO),

      // 6. Week: board progress (need array lengths)
      supabase
        .from("board_progress")
        .select("completed_cards")
        .eq("user_id", user.id)
        .gte("updated_at", weekAgoISO),
    ]);

    const safeSessionList = sessions || [];
    const safeBoardProgress = boardProgress || [];
    const safeCoachSessions = coachSessions || [];

    // ---------- hasData ----------
    const hasData = safeSessionList.length > 0 || safeBoardProgress.length > 0;

    if (!hasData) {
      return NextResponse.json({
        scoreTrend: [],
        weekActivity: { sessions: 0, questionsReviewed: 0, coachChats: 0 },
        questionsProgress: { reviewed: 0, total: 0 },
        readiness: [],
        streak: 0,
        hasData: false,
      });
    }

    // ---------- scoreTrend ----------
    const scoreTrend = safeSessionList.map((s) => ({
      date: new Date(s.completed_at!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      overall: s.overall_score || 0,
      content: s.content_score || 0,
      delivery: s.delivery_score || 0,
    }));

    // ---------- questionsProgress ----------
    const reviewed = safeBoardProgress.reduce(
      (sum, bp) => sum + ((bp.completed_cards as number[])?.length || 0),
      0
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = safeBoardProgress.reduce((sum, bp: any) => {
      const board = bp.interview_boards;
      return sum + (board?.total_questions || 0);
    }, 0);

    // ---------- weekActivity ----------
    const weekQuestionsReviewed = (weekBoardProgress || []).reduce(
      (sum, bp) => sum + ((bp.completed_cards as number[])?.length || 0),
      0
    );

    // ---------- readiness (grouped by lower(company_name)) ----------
    const companyMap = new Map<
      string,
      {
        company: string;
        role: string;
        totalQuestions: number;
        reviewedCards: number;
        totalScore: number;
        sessionCount: number;
        boardId: string | null;
      }
    >();

    // Populate from board progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const bp of safeBoardProgress as any[]) {
      const board = bp.interview_boards;
      if (!board) continue;
      const key = (board.company_name as string).toLowerCase();
      const existing = companyMap.get(key);
      if (existing) {
        existing.totalQuestions += board.total_questions || 0;
        existing.reviewedCards += (bp.completed_cards as number[])?.length || 0;
        if (!existing.boardId) existing.boardId = board.id;
      } else {
        companyMap.set(key, {
          company: board.company_name,
          role: board.role,
          totalQuestions: board.total_questions || 0,
          reviewedCards: (bp.completed_cards as number[])?.length || 0,
          totalScore: 0,
          sessionCount: 0,
          boardId: board.id,
        });
      }
    }

    // Augment with session scores
    for (const s of safeSessionList) {
      const key = s.company_name.toLowerCase();
      const entry = companyMap.get(key);
      if (entry) {
        entry.totalScore += s.overall_score || 0;
        entry.sessionCount += 1;
      }
    }

    const readiness = Array.from(companyMap.values()).map((e) => ({
      company: e.company,
      role: e.role,
      reviewedPct:
        e.totalQuestions > 0
          ? Math.round((e.reviewedCards / e.totalQuestions) * 100)
          : 0,
      avgScore:
        e.sessionCount > 0 ? Math.round(e.totalScore / e.sessionCount) : 0,
      sessions: e.sessionCount,
      boardId: e.boardId,
    }));

    // ---------- streak ----------
    const streak = computeStreak(
      safeSessionList,
      safeBoardProgress as Array<{ updated_at: string }>,
      safeCoachSessions
    );

    return NextResponse.json({
      scoreTrend,
      weekActivity: {
        sessions: weekSessions || 0,
        questionsReviewed: weekQuestionsReviewed,
        coachChats: weekCoach || 0,
      },
      questionsProgress: { reviewed, total },
      readiness,
      streak,
      hasData: true,
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
