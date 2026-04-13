-- Migration: add training_plan column to participants table
-- Run this once in the Supabase SQL editor before deploying the updated app.

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS training_plan JSONB NOT NULL DEFAULT '[]'::jsonb;
