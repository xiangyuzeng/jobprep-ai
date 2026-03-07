// Round configuration — answer length targets + tips per interview round type
// Used by board detail page for visual indicators and the board creation page for round selection

export interface AnswerTarget {
  minChars: number;
  maxChars: number;
  targetMinutes: string;
}

export interface RoundConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  answerTargets: Record<string, AnswerTarget>;
  tips: string[];
}

export const ROUND_CONFIGS: Record<string, RoundConfig> = {
  technical: {
    id: "technical",
    label: "Technical / CTO Round",
    icon: "⚙️",
    color: "var(--vermillion)",
    bgColor: "#fdf2f0",
    description:
      "Deep technical questions testing implementation knowledge, architecture decisions, and hands-on experience",
    answerTargets: {
      B: { minChars: 600, maxChars: 1100, targetMinutes: "3-5 min" },
      P: { minChars: 900, maxChars: 2100, targetMinutes: "4-8 min" },
      T: { minChars: 900, maxChars: 2100, targetMinutes: "4-8 min" },
      C: { minChars: 400, maxChars: 850, targetMinutes: "2-4 min" },
    },
    tips: [
      "Lead with specific tools, commands, and configurations",
      "Include real metrics: latency numbers, throughput, error rates",
      "Explain tradeoffs: why you chose X over Y",
      "Mention monitoring and observability in every answer",
    ],
  },
  hr: {
    id: "hr",
    label: "HR / Recruiter Round",
    icon: "🤝",
    color: "var(--gold-accent)",
    bgColor: "#f8f3e6",
    description:
      "Behavioral and culture-fit questions focused on stability, motivation, and team dynamics",
    answerTargets: {
      B: { minChars: 300, maxChars: 500, targetMinutes: "1-2 min" },
      T: { minChars: 350, maxChars: 600, targetMinutes: "2-3 min" },
      S: { minChars: 400, maxChars: 750, targetMinutes: "2-3 min" },
      C: { minChars: 300, maxChars: 600, targetMinutes: "1-2 min" },
    },
    tips: [
      "Keep answers concise — HR rounds value clarity over depth",
      "Address stability concerns proactively",
      "Show emotional intelligence and self-awareness",
      "Align your narrative with the company's values",
    ],
  },
  ceo: {
    id: "ceo",
    label: "CEO / Executive Round",
    icon: "👔",
    color: "var(--ink-dark)",
    bgColor: "#f0ede7",
    description:
      "Strategic and leadership questions testing vision, decision-making, and executive presence",
    answerTargets: {
      B: { minChars: 400, maxChars: 800, targetMinutes: "1.5-3 min" },
      T: { minChars: 500, maxChars: 1000, targetMinutes: "2-4 min" },
      S: { minChars: 500, maxChars: 1200, targetMinutes: "2-4 min" },
      C: { minChars: 300, maxChars: 700, targetMinutes: "1-2 min" },
    },
    tips: [
      "Lead with business impact, not technical details",
      "Reference company mission and strategic priorities",
      "Show executive presence: be concise and decisive",
      "Have thoughtful questions ready for the CEO",
    ],
  },
  general: {
    id: "general",
    label: "General / Mixed Round",
    icon: "📋",
    color: "#555",
    bgColor: "#f5f5f5",
    description:
      "Mix of technical, behavioral, and situational questions",
    answerTargets: {
      B: { minChars: 400, maxChars: 900, targetMinutes: "2-4 min" },
      T: { minChars: 600, maxChars: 1500, targetMinutes: "3-6 min" },
      P: { minChars: 700, maxChars: 1800, targetMinutes: "3-7 min" },
      C: { minChars: 300, maxChars: 700, targetMinutes: "1-3 min" },
    },
    tips: [
      "Adapt your answer depth to the question type",
      "Use STAR format for behavioral questions",
      "Be ready to switch between technical and soft skills",
      "Prepare 2-3 strong stories that cover multiple topics",
    ],
  },
};

export function getRoundConfig(roundType: string): RoundConfig {
  return ROUND_CONFIGS[roundType] || ROUND_CONFIGS.general;
}

export function getAnswerTarget(
  roundType: string,
  qtype: string
): AnswerTarget {
  const config = getRoundConfig(roundType);
  return (
    config.answerTargets[qtype] || {
      minChars: 400,
      maxChars: 1200,
      targetMinutes: "2-4 min",
    }
  );
}
