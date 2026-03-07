"use client";

import { useState } from "react";
import { BoardTemplate } from "@/lib/board-templates";
import { getRoundConfig } from "@/lib/round-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: BoardTemplate;
  onUse: (templateId: string) => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Round-type border color mapping (hardcoded since CSS vars don't work in border)
// ---------------------------------------------------------------------------

const ROUND_BORDER_COLORS: Record<string, string> = {
  technical: "#c23616",
  hr: "#c9a84c",
  ceo: "#2d2d2d",
  general: "#555",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplateCard({ template, onUse, loading }: TemplateCardProps) {
  const [hovered, setHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  const roundCfg = getRoundConfig(template.roundType);
  const borderColor = ROUND_BORDER_COLORS[template.roundType] || "#555";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: 10,
        padding: 16,
        boxShadow: hovered
          ? "0 4px 12px rgba(0,0,0,0.1)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        borderLeft: `4px solid ${borderColor}`,
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column" as const,
        gap: 8,
      }}
    >
      {/* Company name */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--ink-black)",
        }}
      >
        {template.company}
      </div>

      {/* Role */}
      <div
        style={{
          fontSize: 13,
          color: "#666",
        }}
      >
        {template.role}
      </div>

      {/* Round badge */}
      <div>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 999,
            background: roundCfg.bgColor,
            color: borderColor,
          }}
        >
          {roundCfg.icon} {roundCfg.label}
        </span>
      </div>

      {/* Question count + module count */}
      <div
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#888",
        }}
      >
        {template.questionCount} questions &middot; {template.moduleCount} modules
      </div>

      {/* Source badges */}
      {template.sources.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {template.sources.map((source) => (
            <span
              key={source}
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--paper-cream)",
                color: "#666",
              }}
            >
              {source}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {template.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {template.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 999,
                border: "1px solid #e0e0e0",
                color: "#999",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Use This Template button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!loading) onUse(template.id);
        }}
        disabled={loading}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          width: "100%",
          marginTop: 4,
          padding: "8px 16px",
          borderRadius: 6,
          border: "none",
          background: buttonHovered && !loading
            ? "color-mix(in srgb, var(--vermillion) 85%, black)"
            : "var(--vermillion)",
          color: "white",
          fontWeight: 600,
          fontSize: 13,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.2s",
        }}
      >
        {loading ? "Loading..." : "Use This Template"}
      </button>
    </div>
  );
}
