"use client";

interface Props {
  companyName: string;
}

export default function DossierLoadingState({ companyName }: Props) {
  return (
    <div
      style={{
        borderLeft: "4px solid var(--gold-accent)",
        background: "var(--paper-white)",
        borderRadius: "8px",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: "24px",
          height: "24px",
          border: "3px solid var(--paper-cream)",
          borderTopColor: "var(--gold-accent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          flexShrink: 0,
        }}
      />

      <div>
        <p
          style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--ink-black)",
            margin: "0 0 0.25rem 0",
          }}
        >
          Researching {companyName}...
        </p>
        <p
          style={{
            fontFamily: "var(--font-crimson)",
            fontSize: "0.85rem",
            color: "var(--ink-black)",
            opacity: 0.6,
            margin: 0,
          }}
        >
          Searching the web for company intel, culture, tech stack, and recent news
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
