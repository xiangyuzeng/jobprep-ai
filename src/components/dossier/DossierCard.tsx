"use client";

import { useState } from "react";
import type { CompanyDossier } from "@/lib/dossier";

interface Props {
  dossier: CompanyDossier;
  defaultCollapsed?: boolean;
}

export default function DossierCard({ dossier, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      style={{
        borderLeft: "4px solid var(--gold-accent)",
        background: "var(--paper-white)",
        borderRadius: "8px",
        padding: "0",
        marginBottom: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-cinzel)",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--ink-black)",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>{"\u{1F4CB}"}</span>
          {dossier.companyName}
          <span
            style={{
              fontSize: "0.75rem",
              fontFamily: "var(--font-crimson)",
              fontWeight: 400,
              background: "var(--paper-cream)",
              padding: "2px 8px",
              borderRadius: "12px",
              color: "var(--ink-black)",
              opacity: 0.7,
            }}
          >
            {dossier.profile.industry} {"\u00B7"} {dossier.profile.stage}
          </span>
        </span>
        <span
          style={{
            transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.2s ease",
            fontSize: "0.9rem",
            opacity: 0.5,
          }}
        >
          {"\u25BC"}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          {/* Profile Description */}
          <p
            style={{
              fontFamily: "var(--font-crimson)",
              fontSize: "0.95rem",
              color: "var(--ink-black)",
              lineHeight: 1.6,
              marginBottom: "1rem",
            }}
          >
            {dossier.profile.description}
          </p>

          {/* Info Badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            {[
              { label: dossier.profile.headquarters, icon: "\u{1F4CD}" },
              { label: dossier.profile.size, icon: "\u{1F465}" },
              { label: `Founded ${dossier.profile.founded}`, icon: "\u{1F4C5}" },
            ]
              .filter((b) => b.label && b.label !== "Unknown")
              .map((badge, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-crimson)",
                    background: "var(--paper-cream)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    color: "var(--ink-black)",
                    opacity: 0.8,
                  }}
                >
                  {badge.icon} {badge.label}
                </span>
              ))}
          </div>

          {/* Recent News */}
          {dossier.recentNews.length > 0 && (
            <Section title="Recent News">
              {dossier.recentNews.map((news, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.6rem 0",
                    borderBottom:
                      i < dossier.recentNews.length - 1
                        ? "1px solid var(--paper-cream)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.5rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <strong
                      style={{
                        fontFamily: "var(--font-crimson)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {news.headline}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--gold-accent)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {news.date}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-crimson)",
                      color: "var(--ink-black)",
                      opacity: 0.8,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {news.summary}
                  </p>
                </div>
              ))}
            </Section>
          )}

          {/* Culture & Values */}
          {dossier.culture.values.length > 0 && (
            <Section title="Culture & Values">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  marginBottom: "0.75rem",
                }}
              >
                {dossier.culture.values.map((v, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-crimson)",
                      background: "rgba(45, 106, 79, 0.1)",
                      color: "var(--jade-green)",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
              {dossier.culture.workStyle && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-crimson)",
                    color: "var(--ink-black)",
                    opacity: 0.8,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {dossier.culture.workStyle}
                </p>
              )}
            </Section>
          )}

          {/* Strategy */}
          {dossier.strategy.currentFocus && (
            <Section title="Strategy & Competitors">
              <p
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-crimson)",
                  color: "var(--ink-black)",
                  opacity: 0.8,
                  margin: "0 0 0.5rem 0",
                  lineHeight: 1.5,
                }}
              >
                {dossier.strategy.currentFocus}
              </p>
              {dossier.strategy.competitors.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {dossier.strategy.competitors.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-crimson)",
                        background: "var(--paper-cream)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        color: "var(--ink-black)",
                        opacity: 0.7,
                      }}
                    >
                      vs {c}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Tech Stack */}
          {(dossier.techStack.known.length > 0 ||
            dossier.techStack.inferred.length > 0) && (
            <Section title="Tech Stack">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                }}
              >
                {dossier.techStack.known.map((t, i) => (
                  <span
                    key={`k-${i}`}
                    style={{
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-crimson)",
                      background: "rgba(45, 106, 79, 0.12)",
                      color: "var(--jade-green)",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontWeight: 500,
                    }}
                  >
                    {t}
                  </span>
                ))}
                {dossier.techStack.inferred.map((t, i) => (
                  <span
                    key={`i-${i}`}
                    style={{
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-crimson)",
                      background: "var(--paper-cream)",
                      color: "var(--ink-black)",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontStyle: "italic",
                      opacity: 0.7,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Interview Intel */}
          {dossier.interviewIntel.processNotes && (
            <Section title="Interview Intel">
              <p
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-crimson)",
                  color: "var(--ink-black)",
                  opacity: 0.8,
                  margin: "0 0 0.5rem 0",
                  lineHeight: 1.5,
                }}
              >
                {dossier.interviewIntel.processNotes}
              </p>
              {dossier.culture.interviewTips.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {dossier.culture.interviewTips.map((tip, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "0.83rem",
                        fontFamily: "var(--font-crimson)",
                        color: "var(--ink-black)",
                        padding: "0.2rem 0",
                        opacity: 0.8,
                      }}
                    >
                      {"\u2022"} {tip}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section helper ──
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <h4
        style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--ink-black)",
          marginBottom: "0.5rem",
          paddingBottom: "0.3rem",
          borderBottom: "1px solid var(--paper-cream)",
          letterSpacing: "0.03em",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}
