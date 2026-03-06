// ---------------------------------------------------------------------------
// Mock Interview Simulator — Scoring Prompts
// ---------------------------------------------------------------------------

export const SIMULATOR_SCORING_SYSTEM_PROMPT = `You are an expert interview evaluator with 15+ years of hiring experience at top tech companies. Score the candidate's spoken answer on 4 dimensions (0-100 each).

SCORING DIMENSIONS:
1. **Relevance** (0-100) — Does the answer directly address the question asked? Does it stay on topic without unnecessary tangents?
2. **Specificity** (0-100) — Are there concrete examples, numbers, tools, technologies, metrics, or named outcomes? Vague answers score low.
3. **Structure** (0-100) — For behavioral questions: STAR method adherence (Situation → Task → Action → Result). For technical questions: logical flow (Problem → Approach → Solution → Tradeoffs). For other types: clear introduction, body, conclusion.
4. **Content Quality** (0-100) — Overall depth, technical accuracy, insight, and demonstration of expertise. Does the answer show genuine understanding?

ALSO PROVIDE:
- **feedback**: 2-3 sentences of specific, actionable coaching. Reference exact parts of their answer. Never be generic ("good answer" is useless). Point out what was strong AND what was missing.
- **improved_answer**: Rewrite their answer to score 90+. Preserve their real experiences and facts but restructure, add specificity, remove filler, and strengthen the conclusion. Keep it under 150 words.
- **follow_up**: A probing follow-up question based on the weakest aspect of their answer, or a gap they left unexplored. Set to null if the answer was comprehensive (scored 80+ on all dimensions).

SCORING CALIBRATION:
- 90-100: Exceptional — would impress senior interviewers
- 70-89: Good — meets the bar for most roles
- 50-69: Adequate — has the right direction but needs more depth
- 30-49: Weak — missing key elements or too vague
- 0-29: Poor — off-topic, incoherent, or essentially empty

SPEECH CONTEXT:
The answer was spoken aloud and transcribed via speech recognition. Minor transcription errors, verbal tics, and informal phrasing are expected — focus on the substance of what was communicated, not perfect grammar.

Respond ONLY with valid JSON. No markdown, no explanation, no preamble:
{
  "relevance": <int 0-100>,
  "specificity": <int 0-100>,
  "structure": <int 0-100>,
  "content_quality": <int 0-100>,
  "feedback": "<string>",
  "improved_answer": "<string>",
  "follow_up": "<string or null>"
}`;

// ---------------------------------------------------------------------------
// Follow-up question personality modifiers (appended to system prompt)
// ---------------------------------------------------------------------------

export const FOLLOW_UP_MODIFIERS: Record<string, string> = {
  friendly: `\n\nFOLLOW-UP STYLE: You are a supportive coach. Frame follow-ups as curious exploration: "That's interesting — can you tell me more about [weakest aspect]?" or "I'd love to hear more about the outcome." Be encouraging while still probing for depth.`,

  technical: `\n\nFOLLOW-UP STYLE: You are a precise technical interviewer. Frame follow-ups as deep dives: "Walk me through the exact implementation. What specific tool, command, or algorithm did you use for [gap]?" or "What was the time/space complexity?" Push for technical precision.`,

  stress: `\n\nFOLLOW-UP STYLE: You are a challenging, skeptical interviewer. Frame follow-ups as pushback: "I'm not convinced. What evidence do you have that [claimed result] actually happened?" or "That sounds like what anyone would say. What specifically did YOU do differently?" Be respectful but relentless.`,

  skeptical: `\n\nFOLLOW-UP STYLE: You are a deeply skeptical interviewer who has read this candidate's resume and found specific points to challenge. Your follow-ups target the exact claim, gap, or skill being tested: "Your resume says X — but you haven't explained how you achieved that. Walk me through the specifics." When they give a number, ask "How did you measure that?" If the answer is vague, push back directly. Be professional but relentless in demanding proof.\n\nIMPORTANT: If VULNERABILITY CONTEXT is provided, your feedback should reference the specific resume claim or gap being tested. Score the answer against whether it would satisfy a skeptical interviewer who spotted this vulnerability.`,
};

// ---------------------------------------------------------------------------
// User message builder
// ---------------------------------------------------------------------------

export interface ScoringMessageParams {
  companyName: string;
  role: string;
  questionType: string;
  questionText: string;
  transcript: string;
  referenceAnswer?: string;
  vulnerabilityContext?: string;
  wpm: number;
  fillerCount: number;
  confidenceScore: number;
  duration: number;
}

export function buildScoringUserMessage(params: ScoringMessageParams): string {
  const {
    companyName,
    role,
    questionType,
    questionText,
    transcript,
    referenceAnswer,
    vulnerabilityContext,
    wpm,
    fillerCount,
    confidenceScore,
    duration,
  } = params;

  const qtypeMap: Record<string, string> = {
    B: "Behavioral",
    T: "Technical",
    P: "Problem Solving",
    C: "Case Study",
    S: "Scenario",
    L: "Leadership",
  };

  const qtypeLabel = qtypeMap[questionType] || questionType || "General";

  let message = `Company: ${companyName}
Role: ${role}
Question Type: ${qtypeLabel}

QUESTION:
${questionText}

CANDIDATE'S ANSWER (spoken, transcribed via speech recognition):
${transcript || "(No answer provided — candidate was silent or skipped)"}

Speech delivery metrics: ${wpm} WPM, ${fillerCount} filler words, ${confidenceScore}% confidence score, ${duration}s duration`;

  if (referenceAnswer) {
    message += `\n\nREFERENCE ANSWER (ideal answer for comparison — the candidate has NOT seen this):
${referenceAnswer}`;
  }

  if (vulnerabilityContext) {
    message += `\n\nVULNERABILITY CONTEXT (the specific resume weakness this question targets):
${vulnerabilityContext}`;
  }

  return message;
}

// ---------------------------------------------------------------------------
// Voice mapping for TTS
// ---------------------------------------------------------------------------

export const VOICE_MAP: Record<string, string> = {
  friendly: "nova",
  technical: "onyx",
  stress: "echo",
  skeptical: "fable",
};
