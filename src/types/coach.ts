// ============================================================
// AI Coach — Shared Types
// ============================================================

export type CoachMode = 'general' | 'mock_interviewer' | 'resume_coach' | 'answer_improver';

// Request payload for POST /api/coach/chat
export interface CoachChatRequest {
  message: string;
  sessionId?: string;        // undefined = new session
  coachMode: CoachMode;
  resumeId?: string;
  tailoredResumeId?: string;
  boardId?: string;
  questionId?: string;       // specific question num to coach on
}

// NDJSON stream chunk types
export type StreamChunk =
  | { type: 'system'; sessionId: string; coachMode: CoachMode; requestId: string }
  | { type: 'assistant'; text: string }
  | { type: 'done'; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string }
  | { type: 'aborted' };

// Message as stored in DB / used in UI
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Session as returned by the sessions list endpoint
export interface CoachSession {
  id: string;
  coach_mode: CoachMode;
  title: string | null;
  resume_id: string | null;
  tailored_resume_id: string | null;
  board_id: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}
