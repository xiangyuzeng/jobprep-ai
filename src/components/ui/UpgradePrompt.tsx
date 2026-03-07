"use client";

import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  used: number;
  limit: number;
}

export function UpgradePrompt({ feature, used, limit }: UpgradePromptProps) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: 12,
        border: "2px solid var(--gold-accent)",
        background: "linear-gradient(135deg, #faf7f0 0%, #f5eedd 100%)",
        textAlign: "center",
        maxWidth: 480,
        margin: "24px auto",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#f5eedd",
          border: "2px solid var(--gold-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: 24,
        }}
      >
        ↑
      </div>
      <h3
        style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--ink-dark)",
          margin: "0 0 8px",
        }}
      >
        Monthly Limit Reached
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-mid)",
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        You&apos;ve used{" "}
        <strong>
          {used} of {limit}
        </strong>{" "}
        {feature} this month. Upgrade to Pro for unlimited access.
      </p>
      <Link
        href="/dashboard/upgrade"
        style={{
          display: "inline-block",
          padding: "10px 28px",
          background: "var(--gold-accent)",
          color: "white",
          borderRadius: 4,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#b89840";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--gold-accent)";
        }}
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
