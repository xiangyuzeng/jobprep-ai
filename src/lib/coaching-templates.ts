import type { CoachMode } from '@/types/coach';

export interface QuickAction {
  label: string;
  prompt: string;
}

export const QUICK_ACTIONS: Record<CoachMode, QuickAction[]> = {
  general: [
    {
      label: "Salary negotiation tips",
      prompt: "What salary should I negotiate for based on my experience and the role I'm targeting?",
    },
    {
      label: "Post-interview follow-up",
      prompt: "How should I follow up after the interview? What's the ideal timing and tone?",
    },
    {
      label: "Write a thank-you email",
      prompt: "Help me write a professional thank-you email after my interview.",
    },
    {
      label: "Career strategy advice",
      prompt: "I'd like career strategy advice for planning my next move.",
    },
  ],
  mock_interviewer: [
    {
      label: "Start behavioral round",
      prompt: "Start a behavioral interview round. Ask me one question at a time and give brief feedback after each answer.",
    },
    {
      label: "Technical deep-dive",
      prompt: "Ask me technical questions based on my resume. Go deep on follow-ups.",
    },
    {
      label: "Stress interview simulation",
      prompt: "Simulate a stress interview. Be tough, push back on my answers, and challenge my thinking.",
    },
    {
      label: "Quick 5-question round",
      prompt: "Run a quick 5-question mock interview mixing behavioral and technical questions.",
    },
  ],
  resume_coach: [
    {
      label: "ATS compatibility review",
      prompt: "Review my resume for ATS compatibility with this job description. What keywords am I missing?",
    },
    {
      label: "Improve experience bullets",
      prompt: "Help me improve my work experience bullet points. Make them more impactful with metrics.",
    },
    {
      label: "Missing skills analysis",
      prompt: "What skills am I missing for this job description? How can I address these gaps?",
    },
    {
      label: "Summary section review",
      prompt: "Review and improve my resume summary/objective section for this role.",
    },
  ],
  answer_improver: [
    {
      label: "Add STAR structure",
      prompt: "Help me restructure this answer using the STAR method (Situation, Task, Action, Result).",
    },
    {
      label: "Make it more specific",
      prompt: "Make this answer more specific with concrete numbers, metrics, and outcomes.",
    },
    {
      label: "Shorten to 90 seconds",
      prompt: "Shorten this answer so I can deliver it verbally in about 90 seconds.",
    },
    {
      label: "Strengthen the opening",
      prompt: "Help me create a stronger, more compelling opening line for this answer.",
    },
  ],
};
