"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Tier, Feature } from "@/lib/usage";
import { FEATURE_LABELS } from "@/lib/usage";

interface UsageData {
  tier: Tier;
  usage: Record<Feature, number>;
  limits: Record<Feature, number>;
  period: string;
}

const FEATURES: Feature[] = ["resumeTailors", "boards", "simulatorSessions"];

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "super") {
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 100,
          fontSize: 12,
          fontWeight: 700,
          background: "var(--vermillion)",
          color: "white",
        }}
      >
        ✦ Admin
      </span>
    );
  }
  if (tier === "pro") {
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 100,
          fontSize: 12,
          fontWeight: 700,
          background: "var(--gold-accent)",
          color: "white",
        }}
      >
        Pro
      </span>
    );
  }
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 600,
        background: "#e8e0d0",
        color: "var(--ink-mid)",
      }}
    >
      Free
    </span>
  );
}

export default function UpgradePage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDemoUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/upgrade", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      setUpgrading(false);
    }
  }

  async function handleStripeCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-mid)" }}>
        Loading...
      </div>
    );
  }

  const tier = data?.tier || "free";
  const isFree = tier === "free";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1
        className="font-cinzel"
        style={{ fontSize: 28, fontWeight: 700, color: "var(--ink-dark)", marginBottom: 8 }}
      >
        Membership
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-mid)", marginBottom: 32 }}>
        Manage your plan and usage.
      </p>

      {/* Success / Cancel banners */}
      {success && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#e8f5e9",
            border: "1px solid #a5d6a7",
            color: "#2e7d32",
            fontSize: 14,
            marginBottom: 24,
            fontWeight: 500,
          }}
        >
          Welcome to Pro! Your upgrade is active.
        </div>
      )}
      {canceled && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#fff8e1",
            border: "1px solid #ffe082",
            color: "#f57f17",
            fontSize: 14,
            marginBottom: 24,
            fontWeight: 500,
          }}
        >
          Payment canceled. You can try again anytime.
        </div>
      )}

      {/* Current Plan */}
      <div
        style={{
          padding: "24px",
          borderRadius: 12,
          background: "white",
          border: "1px solid #d4c9b5",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <h2
            className="font-cinzel"
            style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-dark)", margin: 0 }}
          >
            Current Plan
          </h2>
          <TierBadge tier={tier} />
        </div>

        {/* Usage bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FEATURES.map((feature) => {
            const used = data?.usage[feature] ?? 0;
            const limit = data?.limits[feature] ?? 0;
            const isUnlimited = !isFinite(limit);
            const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
            const isAtLimit = !isUnlimited && used >= limit;

            return (
              <div key={feature}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: "var(--ink-dark)", fontWeight: 500 }}>
                    {FEATURE_LABELS[feature]}
                  </span>
                  <span style={{ color: isAtLimit ? "var(--vermillion)" : "var(--ink-mid)" }}>
                    {isUnlimited ? `${used} used` : `${used} / ${limit}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "#e8e0d0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${pct}%`,
                        background: isAtLimit ? "var(--vermillion)" : "var(--gold-accent)",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                )}
                {isUnlimited && (
                  <div style={{ fontSize: 11, color: "#2d6a4f", fontWeight: 500 }}>Unlimited</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: "var(--ink-light)" }}>
          Usage resets monthly. Current period: {data?.period || "—"}
        </div>
      </div>

      {/* Upgrade to Pro */}
      {isFree && (
        <div
          style={{
            padding: "24px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #faf7f0 0%, #f5eedd 100%)",
            border: "2px solid var(--gold-accent)",
            marginBottom: 24,
          }}
        >
          <h2
            className="font-cinzel"
            style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-dark)", margin: "0 0 16px" }}
          >
            Upgrade to Pro
          </h2>

          <ul style={{ margin: "0 0 20px", padding: "0 0 0 20px", fontSize: 14, lineHeight: 2, color: "var(--ink-dark)" }}>
            <li>Unlimited resume tailoring</li>
            <li>Unlimited interview boards</li>
            <li>Unlimited mock interview sessions</li>
            <li>All features included</li>
          </ul>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleStripeCheckout}
              disabled={checkingOut}
              style={{
                padding: "12px 24px",
                background: "var(--gold-accent)",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 15,
                fontWeight: 700,
                cursor: checkingOut ? "not-allowed" : "pointer",
                opacity: checkingOut ? 0.7 : 1,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!checkingOut) e.currentTarget.style.background = "#b89840";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gold-accent)";
              }}
            >
              {checkingOut ? "Redirecting to Stripe..." : "Pay with Stripe — $20/month"}
            </button>

            <button
              onClick={handleDemoUpgrade}
              disabled={upgrading}
              style={{
                padding: "12px 24px",
                background: "var(--vermillion)",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 15,
                fontWeight: 700,
                cursor: upgrading ? "not-allowed" : "pointer",
                opacity: upgrading ? 0.7 : 1,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!upgrading) e.currentTarget.style.background = "var(--vermillion-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--vermillion)";
              }}
            >
              {upgrading ? "Upgrading..." : "Activate Pro (Demo)"}
            </button>
          </div>

          <p style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 12, lineHeight: 1.5 }}>
            Stripe is in test mode. Use card{" "}
            <code style={{ background: "#e8e0d0", padding: "2px 4px", borderRadius: 2, fontSize: 11 }}>
              4242 4242 4242 4242
            </code>
            , any future expiry, any CVC.
          </p>
        </div>
      )}

      {/* Already Pro/Super */}
      {!isFree && (
        <div
          style={{
            padding: "20px 24px",
            borderRadius: 12,
            background: "#e8f5e9",
            border: "1px solid #a5d6a7",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "#2e7d32", margin: 0, fontWeight: 500 }}>
            You&apos;re on the {tier === "super" ? "Super Admin" : "Pro"} plan. All features are unlimited.
          </p>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 13, color: "var(--ink-mid)", textDecoration: "none" }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
