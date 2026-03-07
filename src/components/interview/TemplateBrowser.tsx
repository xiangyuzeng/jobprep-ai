"use client";

import { useState, useMemo } from "react";
import { BOARD_TEMPLATES, getAllTags } from "@/lib/board-templates";
import type { BoardTemplate } from "@/lib/board-templates";
import TemplateCard from "./TemplateCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateBrowserProps {
  onSelectTemplate: (templateId: string) => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplateBrowser({ onSelectTemplate, loading }: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  const allTags = useMemo(() => getAllTags(), []);

  const filteredTemplates = useMemo(() => {
    let templates = BOARD_TEMPLATES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.company.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (activeTag) {
      templates = templates.filter((t) =>
        t.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase())
      );
    }
    return templates;
  }, [searchQuery, activeTag]);

  function handleUse(templateId: string) {
    setLoadingTemplateId(templateId);
    onSelectTemplate(templateId);
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 20,
            color: "var(--ink-black)",
            margin: 0,
          }}
        >
          Quick Start Templates
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
          Pre-built question sets from real interviews
        </p>
      </div>

      {/* Search + tag row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative", width: 240, flexShrink: 0 }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              border: "1px solid #d4c9b5",
              borderRadius: 4,
              fontSize: 13,
              background: "#faf7f0",
              color: "var(--ink-black)",
              outline: "none",
            }}
          />
        </div>

        {/* Tag filter chips */}
        <div
          style={{
            display: "flex",
            gap: 4,
            overflowX: "auto",
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {/* "All" chip */}
          <button
            onClick={() => setActiveTag(null)}
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: !activeTag
                ? "1px solid var(--vermillion)"
                : "1px solid #e0e0e0",
              background: !activeTag
                ? "rgba(194,54,22,0.08)"
                : "#f5f0e8",
              color: !activeTag ? "var(--vermillion)" : "#999",
              transition: "all 0.15s",
            }}
          >
            All
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                border:
                  activeTag === tag
                    ? "1px solid var(--vermillion)"
                    : "1px solid #e0e0e0",
                background:
                  activeTag === tag
                    ? "rgba(194,54,22,0.08)"
                    : "#f5f0e8",
                color: activeTag === tag ? "var(--vermillion)" : "#999",
                transition: "all 0.15s",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      {filteredTemplates.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {filteredTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onUse={handleUse}
              loading={loadingTemplateId === t.id}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#999",
            fontSize: 14,
          }}
        >
          No templates match your search
        </div>
      )}
    </div>
  );
}
