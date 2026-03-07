-- ============================================================
-- Migration 010: Job Application Tracker
-- ============================================================

CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_url text,
  job_description text,
  status text NOT NULL DEFAULT 'saved',
  position_in_column int DEFAULT 0,
  tailored_resume_id uuid REFERENCES tailored_resumes(id) ON DELETE SET NULL,
  board_id uuid REFERENCES interview_boards(id) ON DELETE SET NULL,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  applied_at timestamptz,
  interview_date timestamptz,
  offer_deadline timestamptz,
  salary_range text,
  notes text,
  contact_name text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON job_applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON job_applications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON job_applications
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_job_applications_user_status
  ON job_applications(user_id, status, position_in_column);
