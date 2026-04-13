-- Migration: add session_logs column to participants table
-- Run this once in the Supabase SQL editor before deploying the updated app.

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS session_logs JSONB NOT NULL DEFAULT '[]'::jsonb;
