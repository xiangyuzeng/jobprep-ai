"use client";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
}: ErrorStateProps) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: 12,
        background: "#fdf2f0",
        border: "1px solid #f0c4bc",
        textAlign: "center",
      }}
    >
      {/* Error icon */}
      <div style={{ marginBottom: 12 }}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          style={{ margin: "0 auto" }}
        >
          <circle cx="18" cy="18" r="18" fill="#c23616" opacity={0.12} />
          <circle cx="18" cy="18" r="12" fill="#c23616" opacity={0.2} />
          <text
            x="18"
            y="23"
            textAnchor="middle"
            fill="#c23616"
            fontSize="16"
            fontWeight="bold"
          >
            !
          </text>
        </svg>
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 6,
          margin: "0 0 6px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: "#666",
          lineHeight: 1.5,
          marginBottom: onRetry ? 16 : 0,
          margin: `0 0 ${onRetry ? 16 : 0}px`,
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 24px",
            borderRadius: 8,
            border: "1px solid #c23616",
            background: "transparent",
            color: "#c23616",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c23616";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#c23616";
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
