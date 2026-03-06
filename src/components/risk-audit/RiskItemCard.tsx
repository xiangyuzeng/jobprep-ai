"use client";

import { useState } from "react";
import type {
  ClaimChallenged,
  NarrativeGap,
  TechnicalDepth,
} from "@/types/risk-audit";

interface RiskItemCardProps {
  item: ClaimChallenged | NarrativeGap | TechnicalDepth;
  panelType: "claim" | "narrative" | "technical";
  accentColor: string;
  onPractice?: (itemId: string) => void;
}

const SEVERITY_STYLES = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
} as const;

export default function RiskItemCard({
  item,
  panelType,
  accentColor,
  onPractice,
}: RiskItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const question =
    panelType === "technical"
      ? (item as TechnicalDepth).depth_question
      : (item as ClaimChallenged | NarrativeGap).likely_question;

  return (
    <div
      className="bg-white rounded-sm border border-gray-200 overflow-hidden"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="p-4">
        {/* Header: severity badge + panel-specific content */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {panelType === "claim" && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 mb-2">
                  <p className="text-xs text-gray-600 italic">
                    &ldquo;{(item as ClaimChallenged).claim}&rdquo;
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {(item as ClaimChallenged).why_challenged}
                </p>
              </>
            )}
            {panelType === "narrative" && (
              <>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {(item as NarrativeGap).gap}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Recruiter concern:</span>{" "}
                  {(item as NarrativeGap).recruiter_concern}
                </p>
              </>
            )}
            {panelType === "technical" && (
              <>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {(item as TechnicalDepth).skill}
                </p>
                <p className="text-xs text-gray-400">
                  Found in: {(item as TechnicalDepth).resume_location}
                </p>
              </>
            )}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SEVERITY_STYLES[item.risk_level]}`}
          >
            {item.risk_level}
          </span>
        </div>

        {/* Likely Question */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Likely Question
          </p>
          <p className="text-sm text-gray-800 italic">
            &ldquo;{question}&rdquo;
          </p>
        </div>

        {/* Dangerous Follow-Up */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
            Dangerous Follow-Up
          </p>
          <p className="text-sm text-red-700 font-medium">
            &ldquo;{item.follow_up}&rdquo;
          </p>
        </div>

        {/* Expandable defense section */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors"
          style={{ color: accentColor }}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
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
          {expanded ? "Hide Defense Strategy" : "Show Defense Strategy"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Answer Draft */}
            <div className="bg-gray-50 rounded-sm p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Prepared Answer
              </p>
              <p className="text-sm text-gray-700">{item.answer_draft}</p>
            </div>

            {/* Panel-specific extras */}
            {panelType === "claim" && (
              <>
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                    Evidence to Prepare
                  </p>
                  <p className="text-xs text-green-800 bg-green-50 rounded-sm p-2">
                    {(item as ClaimChallenged).evidence_to_prepare}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Improved Resume Bullet
                  </p>
                  <p className="text-xs text-green-700 bg-green-50 rounded-sm p-2 font-medium">
                    {(item as ClaimChallenged).improved_bullet}
                  </p>
                </div>
              </>
            )}
            {panelType === "narrative" && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Reframe Strategy
                </p>
                <p className="text-xs text-gray-700 bg-blue-50 rounded-sm p-2">
                  {(item as NarrativeGap).reframe_strategy}
                </p>
              </div>
            )}
            {panelType === "technical" && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Minimum Knowledge Required
                </p>
                <p className="text-xs text-gray-700 bg-blue-50 rounded-sm p-2">
                  {(item as TechnicalDepth).minimum_knowledge}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Practice This button */}
      {onPractice && (
        <div
          className="px-4 py-2 border-t border-gray-100 flex justify-end"
          style={{ background: "var(--paper-cream)" }}
        >
          <button
            onClick={() => onPractice(item.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
            style={{
              color: accentColor,
              border: `1px solid ${accentColor}`,
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = accentColor;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = accentColor;
            }}
          >
            Practice This
          </button>
        </div>
      )}
    </div>
  );
}
