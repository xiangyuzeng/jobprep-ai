-- ============================================================
-- Migration 003: Coach Sessions & Messages
-- ============================================================

-- Coach chat sessions
CREATE TABLE coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_mode text NOT NULL DEFAULT 'general'
    CHECK (coach_mode IN ('general', 'mock_interviewer', 'resume_coach', 'answer_improver')),
  title text,
  -- Context references (all nullable — coach works without any)
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  tailored_resume_id uuid REFERENCES tailored_resumes(id) ON DELETE SET NULL,
  board_id uuid REFERENCES interview_boards(id) ON DELETE SET NULL,
  -- Metadata
  message_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coach chat messages
CREATE TABLE coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES coach_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own coach sessions" ON coach_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own coach messages" ON coach_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_coach_messages_session ON coach_messages(session_id, created_at);
CREATE INDEX idx_coach_sessions_user ON coach_sessions(user_id, updated_at DESC);
