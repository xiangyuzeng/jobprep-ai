// ── Risk Audit Types ──
// 3-panel defense playbook structure for resume vulnerability analysis

export type RiskSeverity = "high" | "medium" | "low";

export interface ClaimChallenged {
  id: string; // "cc-0", "cc-1", etc.
  claim: string; // exact text from resume
  location: string; // "experience.0.bullets.2"
  risk_level: RiskSeverity;
  why_challenged: string;
  likely_question: string;
  follow_up: string; // dangerous follow-up if first answer is weak
  evidence_to_prepare: string;
  answer_draft: string; // 3-4 sentence STAR defense
  improved_bullet: string; // rewritten resume bullet
}

export interface NarrativeGap {
  id: string; // "ng-0", "ng-1", etc.
  gap: string;
  risk_level: RiskSeverity;
  recruiter_concern: string; // what they're really worried about
  likely_question: string;
  follow_up: string;
  reframe_strategy: string;
  answer_draft: string;
}

export interface TechnicalDepth {
  id: string; // "td-0", "td-1", etc.
  skill: string;
  resume_location: string;
  risk_level: RiskSeverity;
  depth_question: string; // the depth-testing question
  follow_up: string;
  minimum_knowledge: string;
  answer_draft: string;
}

export interface RiskAuditReport {
  overall_risk_score: number; // 0-100
  risk_level: "low" | "moderate" | "high";
  summary: string;
  claims_challenged: ClaimChallenged[];
  narrative_gaps: NarrativeGap[];
  technical_depth: TechnicalDepth[];
}

// Legacy format (backwards compat)
export interface LegacyVulnerabilityReport {
  overall_risk_score: number;
  categories: Array<{
    category: string;
    severity: RiskSeverity;
    items: Array<{
      location: string;
      original: string;
      issue: string;
      suggestion: string;
    }>;
  }>;
  attack_points: Array<{
    topic: string;
    likely_question: string;
    risk_level: RiskSeverity;
    preparation_advice: string;
  }>;
  summary: string;
}

export type VulnerabilityData = RiskAuditReport | LegacyVulnerabilityReport;

export function isRiskAuditReport(
  data: VulnerabilityData
): data is RiskAuditReport {
  return "claims_challenged" in data;
}
