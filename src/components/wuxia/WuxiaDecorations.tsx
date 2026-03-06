"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import Image from "next/image";

/* ============================================================
   INK DIVIDER — horizontal brush stroke separator
   ============================================================ */
export function InkDivider({
  className = "",
  opacity = 0.3,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div className={`w-full flex justify-center py-4 ${className}`} aria-hidden="true">
      <Image
        src="/assets/wuxia/ink-brush-divider.svg"
        alt=""
        width={400}
        height={20}
        className="w-full max-w-md"
        style={{ opacity }}
        priority={false}
      />
    </div>
  );
}

/* ============================================================
   SEAL STAMP — vermillion red seal watermark
   ============================================================ */
export function SealStamp({
  size = 40,
  className = "",
  style = {},
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Image
      src="/assets/wuxia/seal-stamp.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ pointerEvents: "none", ...style }}
      aria-hidden="true"
      priority={false}
    />
  );
}

/* ============================================================
   SCROLL CARD — container with scroll edge decorations
   ============================================================ */
export function ScrollCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: "var(--paper-cream)",
        borderRadius: 2,
        boxShadow: "0 2px 4px rgba(26,26,26,0.08), 0 8px 24px rgba(26,26,26,0.06)",
      }}
    >
      <Image
        src="/assets/wuxia/scroll-edge-top.svg"
        alt=""
        width={600}
        height={15}
        className="w-full h-auto"
        style={{ display: "block" }}
        aria-hidden="true"
        priority={false}
      />
      <div style={{ padding: "1.5rem 2rem" }}>{children}</div>
      <Image
        src="/assets/wuxia/scroll-edge-bottom.svg"
        alt=""
        width={600}
        height={15}
        className="w-full h-auto"
        style={{ display: "block" }}
        aria-hidden="true"
        priority={false}
      />
    </div>
  );
}

/* ============================================================
   MOUNTAIN BACKGROUND — layered mountain silhouette
   ============================================================ */
export function MountainBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/assets/wuxia/mountain-silhouette.svg"
        alt=""
        width={1440}
        height={300}
        className="w-full h-auto"
        style={{ opacity: 0.5 }}
        priority={false}
      />
    </div>
  );
}

/* ============================================================
   INK SPLASH — decorative accent splatter
   ============================================================ */
export function InkSplash({
  variant = 1,
  className = "",
  style = {},
}: {
  variant?: 1 | 2;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Image
      src={`/assets/wuxia/ink-splash-${variant}.svg`}
      alt=""
      width={variant === 1 ? 200 : 300}
      height={variant === 1 ? 200 : 150}
      className={`pointer-events-none ${className}`}
      style={{ ...style }}
      aria-hidden="true"
      priority={false}
    />
  );
}

/* ============================================================
   INK REVEAL WRAPPER — scroll-triggered fade-in animation
   ============================================================ */
export function InkRevealWrapper({
  children,
  threshold = 0.15,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  threshold?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? "blur(0)" : "blur(8px)",
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.8s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
