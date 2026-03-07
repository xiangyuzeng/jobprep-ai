import { createClient } from "@/lib/supabase/server";
import { getCurrentPeriod, TIER_LIMITS, FEATURE_LABELS } from "@/lib/usage";
import type { Tier, Feature } from "@/lib/usage";
import Link from "next/link";
import DashboardClient from "./DashboardClient";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import ProgressAnalytics from "@/components/dashboard/ProgressAnalytics";

export const dynamic = "force-dynamic";

const FEATURES: Feature[] = ["resumeTailors", "boards", "simulatorSessions"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, original_filename, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: boards } = await supabase
    .from("interview_boards")
    .select("id, company_name, role, round_type, status, total_questions, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  // Fetch tier and usage
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, onboarding_completed")
    .eq("id", user!.id)
    .single();
  const tier = (profile?.tier as Tier) || "free";

  const showOnboarding =
    !profile?.onboarding_completed &&
    (!resumes || resumes.length === 0) &&
    (!boards || boards.length === 0);

  const period = getCurrentPeriod();
  const { data: usageRow } = await supabase
    .from("usage_tracking")
    .select("resume_tailors, boards_created, simulator_sessions")
    .eq("user_id", user!.id)
    .eq("period", period)
    .single();

  const usage = {
    resumeTailors: usageRow?.resume_tailors ?? 0,
    boards: usageRow?.boards_created ?? 0,
    simulatorSessions: usageRow?.simulator_sessions ?? 0,
  };
  const limits = TIER_LIMITS[tier];

  // Fetch application pipeline counts
  const { data: appRows } = await supabase
    .from("job_applications")
    .select("status")
    .eq("user_id", user!.id);

  const pipelineCounts: Record<string, number> = {
    saved: 0, applied: 0, interviewing: 0, offered: 0, rejected: 0,
  };
  (appRows || []).forEach((row: { status: string }) => {
    if (pipelineCounts[row.status] !== undefined) {
      pipelineCounts[row.status]++;
    }
  });
  const totalApps = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  if (showOnboarding) {
    return (
      <div style={{ padding: "24px 0" }}>
        <OnboardingWizard />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-cinzel text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/resume"
            className="bg-[var(--vermillion)] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[var(--vermillion-dark)] transition-colors"
          >
            New Resume
          </Link>
          <Link
            href="/dashboard/prepare"
            className="bg-[var(--gold-accent)] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#b89840] transition-colors"
          >
            Quick Prepare
          </Link>
          <Link
            href="/dashboard/interview"
            className="bg-[var(--ink-dark)] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[var(--ink-black)] transition-colors"
          >
            New Interview Board
          </Link>
        </div>
      </div>

      {/* Usage widget */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "white",
          border: "1px solid #d4c9b5",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dark)" }}>Monthly Usage</span>
            {tier === "pro" && (
              <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: "var(--gold-accent)", color: "white" }}>Pro</span>
            )}
            {tier === "super" && (
              <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: "var(--vermillion)", color: "white" }}>✦ Admin</span>
            )}
          </div>
          {tier === "free" && (
            <Link href="/dashboard/upgrade" style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-accent)", textDecoration: "none" }}>
              Upgrade ↑
            </Link>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map((feature) => {
            const used = usage[feature];
            const limit = limits[feature];
            const isUnlimited = !isFinite(limit);
            const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
            const isAtLimit = !isUnlimited && used >= limit;
            return (
              <div key={feature}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "var(--ink-mid)" }}>{FEATURE_LABELS[feature]}</span>
                  <span style={{ color: isAtLimit ? "var(--vermillion)" : "var(--ink-light)", fontWeight: 500 }}>
                    {isUnlimited ? "∞" : `${used}/${limit}`}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "#e8e0d0", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 2,
                      width: isUnlimited ? "100%" : `${pct}%`,
                      background: isAtLimit ? "var(--vermillion)" : isUnlimited ? "#2d6a4f" : "var(--gold-accent)",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Summary Widget */}
      {totalApps > 0 && (
        <Link
          href="/dashboard/tracker"
          style={{
            display: "block",
            padding: "16px 20px",
            borderRadius: 12,
            background: "white",
            border: "1px solid #d4c9b5",
            marginBottom: 24,
            textDecoration: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dark)" }}>
              Application Pipeline
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-light)" }}>
              {totalApps} total →
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { key: "saved", label: "Saved", color: "#6b7280" },
              { key: "applied", label: "Applied", color: "#2563eb" },
              { key: "interviewing", label: "Interviewing", color: "#c9a84c" },
              { key: "offered", label: "Offered", color: "#2d6a4f" },
              { key: "rejected", label: "Rejected", color: "#9ca3af" },
            ].map(({ key, label, color }) => (
              <div key={key} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>
                  {pipelineCounts[key]}
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-light)", marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Link>
      )}

      <ProgressAnalytics />

      <DashboardClient
        initialResumes={resumes || []}
        initialBoards={boards || []}
      />
    </div>
  );
}
