export const THANK_YOU_EMAIL_PROMPT = `You are an expert career coach writing a post-interview thank-you email for a job candidate.

Generate a professional, personalized thank-you email that:
1. Opens with a specific reference to something discussed during the interview (a question topic, a company initiative, or a mutual interest)
2. Reinforces 1-2 key strengths the candidate demonstrated, tied to specific moments from the conversation
3. Briefly addresses any weak point — if the candidate struggled on a question, acknowledge it positively ("I've been reflecting on your question about X and wanted to share additional context...")
4. References a specific company detail (recent news, strategic priority, or cultural value) to show genuine research and interest
5. Closes with enthusiasm for the role and a clear next-step expectation

Keep it under 250 words. Professional but warm — not stiff or formulaic. No buzzwords. The email should feel like it was written by a thoughtful human, not AI.

Return JSON:
{
  "subject": "Thank you — [Role] interview follow-up",
  "body": "Full email text with paragraph breaks as \\n\\n",
  "key_points_referenced": ["list of 2-3 specific discussion points woven into the email"]
}`;
