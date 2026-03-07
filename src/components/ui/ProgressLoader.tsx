"use client";

import { useState, useEffect, useRef } from "react";

interface ProgressLoaderProps {
  steps: string[];
  estimatedSeconds?: number;
  currentStep?: number;
  done?: boolean;
}

export function ProgressLoader({
  steps,
  estimatedSeconds = 10,
  currentStep: controlledStep,
  done = false,
}: ProgressLoaderProps) {
  const [autoStep, setAutoStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  const activeStep = controlledStep ?? autoStep;

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance steps
  useEffect(() => {
    if (controlledStep !== undefined || done) return;
    const stepDuration = (estimatedSeconds * 1000) / steps.length;
    const interval = setInterval(() => {
      setAutoStep((prev) => {
        // Stall on last step until done
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, stepDuration);
    return () => clearInterval(interval);
  }, [controlledStep, done, estimatedSeconds, steps.length]);

  // Progress bar: stall at 90% until done
  const rawProgress = done
    ? 100
    : Math.min(90, ((activeStep + 1) / steps.length) * 90);

  const remaining = done ? 0 : Math.max(0, estimatedSeconds - elapsed);

  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 12,
        background: "#f5f0e8",
        border: "1px solid #d4c9b5",
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "#e8e0d0",
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            width: `${rawProgress}%`,
            background: done ? "#2d6a4f" : "#c9a84c",
            transition: "width 0.5s ease, background 0.3s",
          }}
        />
      </div>

      {/* Steps checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((step, i) => {
          const isCompleted = done || i < activeStep;
          const isCurrent = !done && i === activeStep;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: isCompleted ? "#2d6a4f" : isCurrent ? "#1a1a1a" : "#bbb",
                fontWeight: isCurrent ? 600 : 400,
                transition: "color 0.3s",
              }}
            >
              {/* Icon */}
              <div style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#2d6a4f" />
                    <path d="M4.5 8L7 10.5L11.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isCurrent ? (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #d4c9b5",
                      borderTopColor: "#1a1a1a",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      border: "1.5px solid #d4c9b5",
                    }}
                  />
                )}
              </div>
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      {/* Time estimate */}
      {!done && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#999",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{elapsed}s elapsed</span>
          <span>~{remaining}s remaining</span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
