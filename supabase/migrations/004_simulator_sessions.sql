-- ============================================================
-- Migration 004: Mock Interview Simulator
-- ============================================================

-- Simulator sessions
CREATE TABLE simulator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  board_id uuid REFERENCES interview_boards(id) ON DELETE SET NULL,
  -- Config
  company_name text NOT NULL,
  role text NOT NULL,
  round_type text NOT NULL,
  interviewer_mode text NOT NULL DEFAULT 'friendly'
    CHECK (interviewer_mode IN ('friendly', 'technical', 'stress')),
  question_count int NOT NULL DEFAULT 5,
  selected_questions jsonb NOT NULL DEFAULT '[]',
  -- Session state
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question_index int DEFAULT 0,
  -- Aggregate scores (computed on completion)
  overall_score int,
  content_score int,
  delivery_score int,
  avg_wpm int,
  total_fillers int,
  avg_confidence int,
  total_duration_secs int,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Individual answers within a session
CREATE TABLE simulator_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES simulator_sessions(id) ON DELETE CASCADE NOT NULL,
  question_index int NOT NULL,
  -- Question data
  question_text text NOT NULL,
  question_type text,
  reference_answer text,
  is_follow_up boolean DEFAULT false,
  parent_answer_id uuid REFERENCES simulator_answers(id),
  -- User response
  transcript text,
  duration_secs int,
  wpm int,
  filler_count int,
  confidence_score int,
  -- AI evaluation
  content_score int,
  relevance_score int,
  specificity_score int,
  structure_score int,
  ai_feedback text,
  ai_improved_answer text,
  -- Follow-up
  follow_up_question text,
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE simulator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own simulator sessions" ON simulator_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own simulator answers" ON simulator_answers
  FOR ALL USING (
    session_id IN (SELECT id FROM simulator_sessions WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_sim_sessions_user ON simulator_sessions(user_id, created_at DESC);
CREATE INDEX idx_sim_answers_session ON simulator_answers(session_id, question_index);
