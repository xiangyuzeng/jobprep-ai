"use client";

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function CoachFollowUpChips({
  suggestions,
  onSelect,
  disabled,
}: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 max-w-3xl mx-auto px-4 pb-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full transition-colors hover:shadow-sm disabled:opacity-40 cursor-pointer"
          style={{
            background: "#e8e4df",
            color: "var(--ink-black)",
            border: "1px solid var(--paper-dark)",
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
