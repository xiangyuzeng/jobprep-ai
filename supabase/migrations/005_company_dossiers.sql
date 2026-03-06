-- ============================================================
-- Migration 005: Company Dossiers
-- ============================================================

-- Cache table for company dossiers
CREATE TABLE company_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_name_lower text NOT NULL,
  dossier jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_dossiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own dossiers" ON company_dossiers
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_dossiers_lookup ON company_dossiers(user_id, company_name_lower, created_at DESC);

-- Add dossier column to existing tables
ALTER TABLE interview_boards ADD COLUMN dossier jsonb;
ALTER TABLE tailored_resumes ADD COLUMN dossier jsonb;
