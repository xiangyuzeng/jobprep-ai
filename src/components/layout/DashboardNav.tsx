"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/resume", label: "Resume" },
  { href: "/dashboard/prepare", label: "Quick Prepare" },
  { href: "/dashboard/coach", label: "AI Coach" },
  { href: "/dashboard/interview", label: "Interview Prep" },
  { href: "/dashboard/simulator", label: "Mock Interview" },
  { href: "/dashboard/tracker", label: "Tracker" },
];

function TierBadge({ tier }: { tier: string }) {
  if (tier === "super") {
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 700,
          background: "var(--vermillion)",
          color: "white",
          whiteSpace: "nowrap",
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
          padding: "2px 8px",
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 700,
          background: "var(--gold-accent)",
          color: "white",
          whiteSpace: "nowrap",
        }}
      >
        Pro
      </span>
    );
  }
  return null;
}

export default function DashboardNav({
  userEmail,
  tier = "free",
  preferredModel = "claude",
}: {
  userEmail: string;
  tier?: string;
  preferredModel?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [model, setModel] = useState(preferredModel);
  const [switching, setSwitching] = useState(false);

  async function handleModelSwitch(newModel: string) {
    if (newModel === model || switching) return;
    setSwitching(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_model: newModel }),
      });
      setModel(newModel);
    } catch (err) {
      console.error("Failed to switch model:", err);
    } finally {
      setSwitching(false);
    }
  }
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
          >
            <Image
              src="/assets/wuxia/seal-stamp.svg"
              alt=""
              width={24}
              height={24}
              aria-hidden="true"
            />
            <span
              className="font-cinzel text-lg font-bold"
              style={{ color: "var(--ink-black)" }}
            >
              JobPrep AI
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm rounded-sm transition-colors"
                style={{
                  color: isActive(link.href, link.exact)
                    ? "var(--ink-black)"
                    : "var(--ink-mid)",
                  fontWeight: isActive(link.href, link.exact) ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop user info */}
          <div className="hidden md:flex items-center gap-3">
            {/* Model toggle pills */}
            <div
              style={{
                display: "flex",
                borderRadius: 100,
                border: "1px solid var(--paper-dark)",
                overflow: "hidden",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <button
                onClick={() => handleModelSwitch("claude")}
                disabled={switching}
                style={{
                  padding: "3px 10px",
                  border: "none",
                  cursor: switching ? "wait" : "pointer",
                  background: model === "claude" ? "var(--ink-dark)" : "transparent",
                  color: model === "claude" ? "var(--paper-cream)" : "var(--ink-mid)",
                  transition: "all 0.15s ease",
                }}
              >
                Claude
              </button>
              <button
                onClick={() => handleModelSwitch("openai")}
                disabled={switching}
                style={{
                  padding: "3px 10px",
                  border: "none",
                  borderLeft: "1px solid var(--paper-dark)",
                  cursor: switching ? "wait" : "pointer",
                  background: model === "openai" ? "var(--ink-dark)" : "transparent",
                  color: model === "openai" ? "var(--paper-cream)" : "var(--ink-mid)",
                  transition: "all 0.15s ease",
                }}
              >
                GPT-4o
              </button>
            </div>
            <TierBadge tier={tier} />
            {tier === "free" && (
              <Link
                href="/dashboard/upgrade"
                className="text-xs font-medium"
                style={{ color: "var(--gold-accent)", textDecoration: "none" }}
              >
                Upgrade
              </Link>
            )}
            <span className="text-sm" style={{ color: "var(--ink-light)" }}>
              {userEmail}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm transition-colors"
                style={{ color: "var(--ink-light)" }}
              >
                Sign out
              </button>
            </form>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <span
              style={{
                display: "block",
                width: 20,
                height: 2,
                background: "var(--ink-dark)",
                borderRadius: 1,
                transition: "transform 0.2s",
                transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: 20,
                height: 2,
                background: "var(--ink-dark)",
                borderRadius: 1,
                transition: "opacity 0.2s",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: 20,
                height: 2,
                background: "var(--ink-dark)",
                borderRadius: 1,
                transition: "transform 0.2s",
                transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden"
        style={{
          maxHeight: menuOpen ? 400 : 0,
          overflow: "hidden",
          transition: "max-height 0.2s ease",
          borderTop: menuOpen ? "1px solid var(--paper-dark)" : "none",
        }}
      >
        <div className="px-4 py-3" style={{ background: "rgba(237, 230, 214, 0.98)" }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2.5 text-sm transition-colors"
              style={{
                color: isActive(link.href, link.exact)
                  ? "var(--ink-black)"
                  : "var(--ink-mid)",
                fontWeight: isActive(link.href, link.exact) ? 600 : 400,
                textDecoration: "none",
                borderBottom: "1px solid var(--paper-dark)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {tier === "free" && (
            <Link
              href="/dashboard/upgrade"
              className="block py-2.5 text-sm font-medium transition-colors"
              style={{
                color: "var(--gold-accent)",
                textDecoration: "none",
                borderBottom: "1px solid var(--paper-dark)",
              }}
            >
              ↑ Upgrade to Pro
            </Link>
          )}
          {/* Mobile model toggle */}
          <div
            className="flex items-center gap-2 py-2.5"
            style={{ borderBottom: "1px solid var(--paper-dark)" }}
          >
            <span style={{ fontSize: 12, color: "var(--ink-mid)" }}>Model:</span>
            <div
              style={{
                display: "flex",
                borderRadius: 100,
                border: "1px solid var(--paper-dark)",
                overflow: "hidden",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <button
                onClick={() => handleModelSwitch("claude")}
                disabled={switching}
                style={{
                  padding: "3px 10px",
                  border: "none",
                  cursor: switching ? "wait" : "pointer",
                  background: model === "claude" ? "var(--ink-dark)" : "transparent",
                  color: model === "claude" ? "var(--paper-cream)" : "var(--ink-mid)",
                  transition: "all 0.15s ease",
                }}
              >
                Claude
              </button>
              <button
                onClick={() => handleModelSwitch("openai")}
                disabled={switching}
                style={{
                  padding: "3px 10px",
                  border: "none",
                  borderLeft: "1px solid var(--paper-dark)",
                  cursor: switching ? "wait" : "pointer",
                  background: model === "openai" ? "var(--ink-dark)" : "transparent",
                  color: model === "openai" ? "var(--paper-cream)" : "var(--ink-mid)",
                  transition: "all 0.15s ease",
                }}
              >
                GPT-4o
              </button>
            </div>
          </div>
          <div
            className="flex items-center justify-between pt-3 mt-1"
            style={{ borderTop: "none" }}
          >
            <div className="flex items-center gap-2">
              <TierBadge tier={tier} />
              <span className="text-xs" style={{ color: "var(--ink-light)" }}>
                {userEmail}
              </span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs transition-colors"
                style={{ color: "var(--ink-light)" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
