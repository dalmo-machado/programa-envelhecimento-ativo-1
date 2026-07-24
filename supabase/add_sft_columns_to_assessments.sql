-- ============================================================
--  Migration: add SFT + body-composition columns to assessments
--  and add unique constraint required for safe UPSERT.
--
--  Safe to run multiple times — all guards use IF NOT EXISTS.
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- STEP 1: Diagnostic — check which columns already exist
-- (Run this first; comment it out before running STEP 2)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assessments'
ORDER BY ordinal_position;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Add any missing columns
-- (Run after verifying STEP 1 output)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE assessments
  -- Body composition (Estação 1)
  ADD COLUMN IF NOT EXISTS waist_cm               NUMERIC,
  ADD COLUMN IF NOT EXISTS hip_cm                 NUMERIC,
  ADD COLUMN IF NOT EXISTS body_fat_percent       NUMERIC,
  ADD COLUMN IF NOT EXISTS rcq                    NUMERIC,
  -- Force & Agility — handgrip (Estação 2)
  ADD COLUMN IF NOT EXISTS handgrip_nondominant_kgf NUMERIC,
  -- Force & Agility — Senior Fitness Test (Estação 2)
  ADD COLUMN IF NOT EXISTS chair_stand_reps       INTEGER,
  ADD COLUMN IF NOT EXISTS arm_curl_reps          INTEGER,
  ADD COLUMN IF NOT EXISTS chair_sit_reach_cm     NUMERIC,
  ADD COLUMN IF NOT EXISTS up_and_go_seconds      NUMERIC,
  -- Aerobic capacity (Estação 3)
  ADD COLUMN IF NOT EXISTS six_min_walk_meters    NUMERIC,
  ADD COLUMN IF NOT EXISTS six_min_walk_percent_predicted NUMERIC;


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Add unique constraint on (participant_id, date)
-- This is required for UPSERT (ON CONFLICT DO UPDATE) to work.
-- Only run if the constraint does not exist yet.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessments_participant_id_date_key'
  ) THEN
    ALTER TABLE assessments
      ADD CONSTRAINT assessments_participant_id_date_key
      UNIQUE (participant_id, date);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Verify — check for existing assessment rows with NULLs
-- in the SFT columns (data potentially lost from failed inserts).
-- ─────────────────────────────────────────────────────────────
SELECT
  participant_id,
  date,
  grip_kgf,
  chair_stand_reps,
  arm_curl_reps,
  up_and_go_seconds,
  six_min_walk_meters,
  chair_sit_reach_cm
FROM assessments
ORDER BY participant_id, date;

-- If chair_stand_reps / up_and_go_seconds / six_min_walk_meters are all NULL
-- for existing rows, those columns were missing at insert time. Use the
-- "Recuperar Avaliações → Supabase" button in the Gestor panel to re-push
-- the complete data from the browser's memory.
