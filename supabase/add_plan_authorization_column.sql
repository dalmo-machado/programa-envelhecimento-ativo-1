-- Migration: add plan_authorization column to participants table
-- Run once in the Supabase SQL editor before deploying this feature.
--
-- Records the researcher's endorsement of the training level and load before
-- the plan is generated. The app computes a suggestion from the SFT results;
-- this column is the evidence that a professional reviewed that suggestion and
-- took responsibility for the prescription.
--
-- Structure:
--   authorized_at  : ISO timestamp of the confirmation
--   authorized_by  : researcher access code (or role, when the code is unknown)
--   computed_level : 1 | 2 | 3 — the level the algorithm suggested
--   applied_level  : 1 | 2 | 3 — the level actually prescribed
--   adjusted       : boolean — true when applied_level differs from computed_level

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS plan_authorization JSONB DEFAULT NULL;
