-- Migration: add app_feedback column to participants table
-- Run once in the Supabase SQL editor before deploying this feature.
--
-- Stores the final app-usability questionnaire submitted after session 24.
-- Structure:
--   submitted_at     : ISO timestamp of submission
--   sus_scores       : array of 10 integers (1–5), questions Q1–Q10 (all positive framing)
--   improvement_scores: array of 6 integers (1–5), questions Q11–Q16 (physical improvement)
--   experience_scores : array of 6 integers (1–5), questions Q17–Q22 (program experience)
--   open_best        : free text — what the participant liked most
--   open_improve     : free text — suggestions for improvement

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS app_feedback JSONB DEFAULT NULL;
