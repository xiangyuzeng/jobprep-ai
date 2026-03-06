"use client";

import { useState } from "react";
import type { RiskAuditReport, RiskSeverity } from "@/types/risk-audit";
import RiskItemCard from "./RiskItemCard";

// ── CircularProgress (inline copy from resume page) ──
function CircularProgress({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "text-green-500"
      : score >= 60
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{score}</span>
      </div>
    </div>
  );
}

// ── Panel config ──
const PANELS = [
  {
    key: "claims_challenged" as const,
    label: "Claims Likely to Be Challenged",
    shortLabel: "Claims",
    accentColor: "var(--vermillion)",
    panelType: "claim" as const,
  },
  {
    key: "narrative_gaps" as const,
    label: "Narrative Gaps Recruiters Will Probe",
    shortLabel: "Gaps",
    accentColor: "var(--gold-accent)",
    panelType: "narrative" as const,
  },
  {
    key: "technical_depth" as const,
    label: "Technical Depth You Must Defend",
    shortLabel: "Tech Depth",
    accentColor: "var(--ink-dark)",
    panelType: "technical" as const,
  },
] as const;

type FilterLevel = "all" | RiskSeverity;

interface RiskAuditPanelProps {
  report: RiskAuditReport;
  vulnerabilityId: string;
  onPracticeItem: (itemId: string) => void;
  onPracticeAll: () => void;
  onGenerateBoard?: () => void;
  onRegenerate: () => void;
}

export default function RiskAuditPanel({
  report,
  onPracticeItem,
  onPracticeAll,
  onGenerateBoard,
  onRegenerate,
}: RiskAuditPanelProps) {
  const [filter, setFilter] = useState<FilterLevel>("all");
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(
    new Set()
  );

  const togglePanel = (key: string) => {
    setCollapsedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const defenseScore = 100 - report.overall_risk_score;
  const totalItems =
    report.claims_challenged.length +
    report.narrative_gaps.length +
    report.technical_depth.length;
  const highCount = [
    ...report.claims_challenged,
    ...report.narrative_gaps,
    ...report.technical_depth,
  ].filter((i) => i.risk_level === "high").length;

  return (
    <div className="space-y-5">
      {/* Risk Score + Summary */}
      <div className="flex items-start gap-4">
        <CircularProgress score={defenseScore} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Risk Score: {report.overall_risk_score}/100
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {report.risk_level === "low"
              ? "Low risk — your resume is solid"
              : report.risk_level === "moderate"
                ? "Moderate risk — some areas need attention"
                : "High risk — significant vulnerabilities found"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {totalItems} risk items
            </span>
            {highCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {highCount} high priority
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <p className="text-sm text-gray-600 bg-orange-50 border border-orange-100 rounded-sm p-3">
          {report.summary}
        </p>
      )}

      {/* Stat pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {PANELS.map((panel) => {
          const count = report[panel.key].length;
          return (
            <button
              key={panel.key}
              onClick={() => {
                // Expand this panel if collapsed
                setCollapsedPanels((prev) => {
                  const next = new Set(prev);
                  next.delete(panel.key);
                  return next;
                });
                // Scroll to panel
                document
                  .getElementById(`panel-${panel.key}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer"
              style={{
                borderColor: panel.accentColor,
                color: panel.accentColor,
              }}
            >
              {count} {panel.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 mr-1">Filter:</span>
        {(["all", "high", "medium", "low"] as FilterLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
              filter === level
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* 3 Panels */}
      {PANELS.map((panel) => {
        const items = report[panel.key].filter(
          (item) => filter === "all" || item.risk_level === filter
        );
        const isCollapsed = collapsedPanels.has(panel.key);

        return (
          <div key={panel.key} id={`panel-${panel.key}`}>
            <button
              onClick={() => togglePanel(panel.key)}
              className="flex items-center gap-2 mb-3 w-full text-left cursor-pointer group"
            >
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: panel.accentColor }}
              />
              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                {panel.label}
              </h4>
              <span className="text-xs text-gray-400">
                ({items.length}
                {filter !== "all"
                  ? ` ${filter}`
                  : ` of ${report[panel.key].length}`}
                )
              </span>
            </button>
            {!isCollapsed && (
              <div className="space-y-3 ml-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <RiskItemCard
                      key={item.id}
                      item={item}
                      panelType={panel.panelType}
                      accentColor={panel.accentColor}
                      onPractice={onPracticeItem}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-2">
                    {filter !== "all"
                      ? `No ${filter}-risk items in this panel`
                      : "No items in this panel"}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom CTA bar */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <button
          onClick={onPracticeAll}
          className="w-full py-2.5 rounded-sm text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: "var(--gold-accent)",
            color: "#fff",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#b89840")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--gold-accent)")
          }
        >
          Start Skeptical Interview
        </button>
        <p className="text-xs text-gray-400 text-center">
          Practice defending all {totalItems} risk items with a skeptical AI
          interviewer
        </p>
        {onGenerateBoard && (
          <button
            onClick={onGenerateBoard}
            className="w-full py-2 rounded-sm text-sm font-medium border transition-colors flex items-center justify-center gap-2 cursor-pointer"
            style={{
              borderColor: "var(--paper-dark)",
              color: "var(--ink-dark)",
            }}
          >
            Generate Defense Board
          </button>
        )}
      </div>

      {/* Regenerate */}
      <button
        onClick={onRegenerate}
        className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
      >
        Regenerate Audit
      </button>
    </div>
  );
}
