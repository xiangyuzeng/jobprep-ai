"use client";

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #ede6d6 25%, #faf7f0 50%, #ede6d6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s ease-in-out infinite",
  borderRadius: 4,
};

export function Skeleton({
  width = "100%",
  height = 16,
  className,
  style,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <div
        className={className}
        style={{ width, height, ...shimmerStyle, ...style }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ["75%", "100%", "60%", "90%", "45%"];
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 12,
        background: "#f5f0e8",
        border: "1px solid #d4c9b5",
      }}
    >
      <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={widths[i % widths.length]}
          height={12}
          style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
        />
      ))}
    </div>
  );
}

export function TextSkeleton({
  lines = 3,
  widths,
}: {
  lines?: number;
  widths?: string[];
}) {
  const defaultWidths = ["100%", "90%", "75%", "95%", "60%"];
  const w = widths || defaultWidths;
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={w[i % w.length]}
          height={12}
          style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
        />
      ))}
    </div>
  );
}
