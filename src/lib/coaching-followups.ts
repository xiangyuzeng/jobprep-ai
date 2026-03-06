import type { CoachMode } from '@/types/coach';

/**
 * Generate 2-3 contextual follow-up suggestion chips based on
 * the current coaching mode and the content of the last assistant message.
 */
export function generateFollowUps(
  mode: CoachMode,
  lastAssistantMessage: string,
  _messageCount: number
): string[] {
  const lower = lastAssistantMessage.toLowerCase();

  // ── Mock Interviewer ──
  if (mode === 'mock_interviewer') {
    if (lower.includes('tell me about') || lower.includes('describe a time') || lower.includes('how would you')) {
      return [
        'Let me answer that',
        'Can you rephrase the question?',
        'Skip to the next question',
      ];
    }
    if (lower.includes('feedback') || lower.includes('good answer') || lower.includes('well done') || lower.includes('strong answer')) {
      return [
        'Ask me the next question',
        'Let me try that answer again',
        'How would a perfect answer sound?',
      ];
    }
    if (lower.includes('follow-up') || lower.includes('follow up') || lower.includes('dig deeper')) {
      return [
        'Go ahead, ask the follow-up',
        'Move on to a new topic',
        'Give me a hint first',
      ];
    }
    return [
      'Ask me another question',
      'Give me feedback on my answer',
      'Switch to behavioral questions',
    ];
  }

  // ── Resume Coach ──
  if (mode === 'resume_coach') {
    if (lower.includes('bullet') || lower.includes('experience section') || lower.includes('work history')) {
      return [
        'Rewrite that bullet for me',
        'Review the next section',
        'Show me the ATS perspective',
      ];
    }
    if (lower.includes('skill') || lower.includes('gap') || lower.includes('missing')) {
      return [
        'How can I address this gap?',
        'Suggest a project to fill this gap',
        'What else should I highlight?',
      ];
    }
    if (lower.includes('score') || lower.includes('match') || lower.includes('ats')) {
      return [
        'How can I improve my score?',
        'Which keywords should I add?',
        'Review my summary section',
      ];
    }
    return [
      'Review my work experience',
      'Check my skills section',
      'What would a recruiter think?',
    ];
  }

  // ── Answer Improver ──
  if (mode === 'answer_improver') {
    if (lower.includes('star') || lower.includes('rewritten') || lower.includes('revised')) {
      return [
        'Score this answer 1-5',
        'What would a tough interviewer ask next?',
        'Make it even more concise',
      ];
    }
    if (lower.includes('specific') || lower.includes('metric') || lower.includes('number')) {
      return [
        'Help me with the result section',
        'Add a quantified outcome',
        'Practice delivering this out loud',
      ];
    }
    return [
      'Add more specific numbers',
      'Help me with the opening line',
      'What is the ideal structure?',
    ];
  }

  // ── General Career Coach ──
  if (lower.includes('salary') || lower.includes('negotiate') || lower.includes('compensation')) {
    return [
      'How do I counter a low offer?',
      'What benefits should I negotiate?',
      'When is the best time to discuss salary?',
    ];
  }
  if (lower.includes('email') || lower.includes('follow up') || lower.includes('thank')) {
    return [
      'Can you review the draft?',
      'What if I don\'t hear back?',
      'Should I connect on LinkedIn too?',
    ];
  }

  // Default general follow-ups
  return [
    'Tell me more',
    'Can you give an example?',
    'What else should I consider?',
  ];
}
