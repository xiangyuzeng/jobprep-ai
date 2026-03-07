-- Add tier and Stripe fields to profiles
ALTER TABLE profiles ADD COLUMN tier text NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN tier_updated_at timestamptz;
ALTER TABLE profiles ADD COLUMN stripe_customer_id text;

-- Usage tracking table (monthly periods, no cron needed)
CREATE TABLE usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period text NOT NULL,
  resume_tailors int DEFAULT 0,
  boards_created int DEFAULT 0,
  simulator_sessions int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Set super admin
UPDATE profiles SET tier = 'super' WHERE email = 'zengxiangyu1@gmail.com';
