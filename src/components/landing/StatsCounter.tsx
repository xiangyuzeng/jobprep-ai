"use client";

import { useRef, useState, useEffect } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Questions Generated" },
  { value: 12, suffix: "", label: "Companies Supported" },
  { value: 130, suffix: "+", label: "Practice Sessions" },
];

const ICONS: React.ReactNode[] = [
  // Scroll / document icon
  <svg key="scroll" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M4 7v10a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V7" />
    <path d="M9 12h6M9 16h4" />
  </svg>,
  // Target icon
  <svg key="target" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="var(--ink-mid)" />
  </svg>,
  // Sword / practice icon
  <svg key="sword" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19L19 5M19 5v5M19 5h-5" />
    <path d="M9 15l-4 4M7 13l-4 4" />
  </svg>,
];

function AnimatedNumber({ value, suffix, shouldAnimate }: { value: number; suffix: string; shouldAnimate: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;
    const duration = 2000;
    let start: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [shouldAnimate, value]);

  return (
    <span
      className="font-cinzel"
      style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--ink-black)", lineHeight: 1.1 }}
    >
      {display}{suffix}
    </span>
  );
}

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          style={{
            textAlign: "center",
            opacity: animate ? 1 : 0,
            transform: animate ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 0.6s ease ${i * 200}ms, transform 0.6s ease ${i * 200}ms`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "47% 53% 49% 51%",
              backgroundColor: "var(--paper-cream)",
              border: "1.5px solid var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            {ICONS[i]}
          </div>

          <AnimatedNumber value={stat.value} suffix={stat.suffix} shouldAnimate={animate} />

          <p style={{ fontSize: "0.875rem", color: "var(--ink-mid)", marginTop: 4 }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
