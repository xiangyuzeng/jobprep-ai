import { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "free" | "pro" | "super";
export type Feature = "resumeTailors" | "boards" | "simulatorSessions";

const SUPER_EMAIL = "zengxiangyu1@gmail.com";

export const TIER_LIMITS: Record<Tier, Record<Feature, number>> = {
  free: { resumeTailors: 3, boards: 1, simulatorSessions: 1 },
  pro: { resumeTailors: Infinity, boards: Infinity, simulatorSessions: Infinity },
  super: { resumeTailors: Infinity, boards: Infinity, simulatorSessions: Infinity },
};

const FEATURE_LABELS: Record<Feature, string> = {
  resumeTailors: "Resume Tailors",
  boards: "Interview Boards",
  simulatorSessions: "Mock Interviews",
};

const FEATURE_TO_COLUMN: Record<Feature, string> = {
  resumeTailors: "resume_tailors",
  boards: "boards_created",
  simulatorSessions: "simulator_sessions",
};

export { FEATURE_LABELS };

export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tier: Tier; email: string }> {
  const { data } = await supabase
    .from("profiles")
    .select("tier, email")
    .eq("id", userId)
    .single();

  const tier = (data?.tier as Tier) || "free";
  const email = data?.email || "";

  // Hardcoded super override
  if (email === SUPER_EMAIL && tier !== "super") {
    return { tier: "super", email };
  }

  return { tier, email };
}

export async function checkLimit(
  supabase: SupabaseClient,
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; used: number; limit: number; tier: Tier }> {
  const { tier, email } = await getUserTier(supabase, userId);

  // Super and Pro bypass
  if (tier === "super" || tier === "pro" || email === SUPER_EMAIL) {
    return { allowed: true, used: 0, limit: Infinity, tier };
  }

  const limit = TIER_LIMITS[tier][feature];
  const period = getCurrentPeriod();
  const column = FEATURE_TO_COLUMN[feature];

  const { data } = await supabase
    .from("usage_tracking")
    .select(column)
    .eq("user_id", userId)
    .eq("period", period)
    .single();

  const used = (data as Record<string, number> | null)?.[column] ?? 0;

  return { allowed: used < limit, used, limit, tier };
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: Feature
): Promise<void> {
  const period = getCurrentPeriod();
  const column = FEATURE_TO_COLUMN[feature];

  // Try to update existing row
  const { data: existing } = await supabase
    .from("usage_tracking")
    .select("id, " + column)
    .eq("user_id", userId)
    .eq("period", period)
    .single();

  if (existing) {
    const row = existing as unknown as Record<string, number | string>;
    const currentVal = (row[column] as number) ?? 0;
    await supabase
      .from("usage_tracking")
      .update({ [column]: currentVal + 1 })
      .eq("id", row.id as string);
  } else {
    await supabase.from("usage_tracking").insert({
      user_id: userId,
      period,
      [column]: 1,
    });
  }
}

export async function getUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  tier: Tier;
  usage: Record<Feature, number>;
  limits: Record<Feature, number>;
  period: string;
}> {
  const { tier } = await getUserTier(supabase, userId);
  const period = getCurrentPeriod();

  const { data } = await supabase
    .from("usage_tracking")
    .select("resume_tailors, boards_created, simulator_sessions")
    .eq("user_id", userId)
    .eq("period", period)
    .single();

  const usage: Record<Feature, number> = {
    resumeTailors: data?.resume_tailors ?? 0,
    boards: data?.boards_created ?? 0,
    simulatorSessions: data?.simulator_sessions ?? 0,
  };

  const limits = TIER_LIMITS[tier];

  return { tier, usage, limits, period };
}
