-- Allow 'skeptical' as an interviewer mode
ALTER TABLE simulator_sessions
  DROP CONSTRAINT simulator_sessions_interviewer_mode_check;
ALTER TABLE simulator_sessions
  ADD CONSTRAINT simulator_sessions_interviewer_mode_check
  CHECK (interviewer_mode IN ('friendly', 'technical', 'stress', 'skeptical'));
