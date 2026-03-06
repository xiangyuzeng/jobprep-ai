// ---------------------------------------------------------------------------
// Company Dossier — Core Library
// ---------------------------------------------------------------------------

import { anthropic } from "@/lib/claude";
import { DOSSIER_SYNTHESIS_PROMPT } from "@/lib/prompts/dossier-synthesis";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompanyDossier {
  companyName: string;
  profile: {
    industry: string;
    founded: string;
    headquarters: string;
    size: string;
    stage: "startup" | "growth" | "enterprise" | "public";
    description: string;
  };
  recentNews: Array<{
    headline: string;
    summary: string;
    date: string;
    relevance: string;
  }>;
  culture: {
    values: string[];
    workStyle: string;
    glassdoorSentiment: string;
    interviewTips: string[];
  };
  strategy: {
    currentFocus: string;
    challenges: string[];
    competitors: string[];
    recentMoves: string;
  };
  techStack: {
    known: string[];
    inferred: string[];
    engineeringBlog: string | null;
  };
  interviewIntel: {
    commonQuestions: string[];
    processNotes: string;
    hiringFocus: string;
  };
}

// ---------------------------------------------------------------------------
// buildCompanyDossier — Two-call pipeline (Research → Synthesis)
// ---------------------------------------------------------------------------

export async function buildCompanyDossier(
  companyName: string,
  jobDescription?: string
): Promise<CompanyDossier> {
  // ── Call 1: Research via web search ──────────────────────────────────────
  const researchPrompt = buildResearchPrompt(companyName, jobDescription);

  const researchResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system:
      "You are a research assistant gathering intelligence about a company for a job interview candidate. " +
      "Search the web for current, factual information. Focus on recent news, culture, tech stack, interview process, and strategic direction. " +
      "Be thorough but concise. Cite specific facts, dates, and numbers when available.",
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [{ role: "user", content: researchPrompt }],
  });

  // Extract text blocks from the research response
  const rawResearch = researchResponse.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("\n\n");

  if (!rawResearch.trim()) {
    throw new Error("Web research returned no text content");
  }

  // ── Call 2: Synthesis into structured JSON ─────────────────────────────
  const synthesisResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: DOSSIER_SYNTHESIS_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here are raw research findings about "${companyName}":\n\n${rawResearch}`,
      },
    ],
  });

  const synthesisText = synthesisResponse.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("");

  // Parse JSON — strip markdown fences if present
  const jsonStr = synthesisText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const dossier: CompanyDossier = JSON.parse(jsonStr);
  return dossier;
}

// ---------------------------------------------------------------------------
// formatDossierContext — XML block for injection into AI prompts
// ---------------------------------------------------------------------------

export function formatDossierContext(dossier: CompanyDossier): string {
  const news = dossier.recentNews
    .map(
      (n) =>
        `  <news_item date="${n.date}">\n    <headline>${n.headline}</headline>\n    <summary>${n.summary}</summary>\n    <relevance>${n.relevance}</relevance>\n  </news_item>`
    )
    .join("\n");

  return `<company_dossier company="${dossier.companyName}">
  <profile>
    <industry>${dossier.profile.industry}</industry>
    <founded>${dossier.profile.founded}</founded>
    <headquarters>${dossier.profile.headquarters}</headquarters>
    <size>${dossier.profile.size}</size>
    <stage>${dossier.profile.stage}</stage>
    <description>${dossier.profile.description}</description>
  </profile>

  <recent_news>
${news}
  </recent_news>

  <culture>
    <values>${dossier.culture.values.join(", ")}</values>
    <work_style>${dossier.culture.workStyle}</work_style>
    <glassdoor_sentiment>${dossier.culture.glassdoorSentiment}</glassdoor_sentiment>
    <interview_tips>${dossier.culture.interviewTips.join("; ")}</interview_tips>
  </culture>

  <strategy>
    <current_focus>${dossier.strategy.currentFocus}</current_focus>
    <challenges>${dossier.strategy.challenges.join("; ")}</challenges>
    <competitors>${dossier.strategy.competitors.join(", ")}</competitors>
    <recent_moves>${dossier.strategy.recentMoves}</recent_moves>
  </strategy>

  <tech_stack>
    <known>${dossier.techStack.known.join(", ")}</known>
    <inferred>${dossier.techStack.inferred.join(", ")}</inferred>
    ${dossier.techStack.engineeringBlog ? `<engineering_blog>${dossier.techStack.engineeringBlog}</engineering_blog>` : ""}
  </tech_stack>

  <interview_intel>
    <common_questions>${dossier.interviewIntel.commonQuestions.join("; ")}</common_questions>
    <process_notes>${dossier.interviewIntel.processNotes}</process_notes>
    <hiring_focus>${dossier.interviewIntel.hiringFocus}</hiring_focus>
  </interview_intel>
</company_dossier>`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildResearchPrompt(
  companyName: string,
  jobDescription?: string
): string {
  let prompt = `Research the company "${companyName}" for a job interview candidate. Find:\n\n`;
  prompt += `1. Company profile: industry, founding year, headquarters, employee count, stage (startup/growth/enterprise/public)\n`;
  prompt += `2. Recent news: major announcements, product launches, funding rounds, leadership changes (last 6 months)\n`;
  prompt += `3. Company culture: stated values, work environment, Glassdoor sentiment\n`;
  prompt += `4. Strategy: current focus areas, key challenges, main competitors, recent strategic moves\n`;
  prompt += `5. Technology stack: known technologies, engineering blog if any\n`;
  prompt += `6. Interview intelligence: common interview questions, process details, what they look for in candidates\n`;

  if (jobDescription) {
    prompt += `\nThe candidate is applying for a role with this job description:\n${jobDescription}\n`;
    prompt += `\nPrioritize information relevant to this specific role.`;
  }

  return prompt;
}
