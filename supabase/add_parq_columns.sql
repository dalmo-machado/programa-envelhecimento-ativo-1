-- PAR-Q registration on the participant record.
--
-- The app has always applied the PAR-Q at enrolment (pages/ScreeningPage.tsx),
-- but the answers lived only in React state and were discarded once the page
-- unmounted: the screening gated enrolment without leaving a record of it.
-- Parecer 8.679.547 (item 8) requires the application of the PAR-Q to be
-- registered, so the answers are now stored alongside the participant.
--
-- Deliberately ALTER TABLE on an existing table rather than a new table:
-- participants already carries its Data API grants and its RLS configuration,
-- so these columns inherit both and are unaffected by the 30/10/2026 change to
-- default grants in the public schema.
--
-- parq_date duplicates parq_answers->>'answered_at' on purpose — it is
-- queryable and indexable without unpacking the jsonb.
--
-- Applied in the Supabase SQL Editor on 2026-09-23.

alter table public.participants
  add column if not exists parq_answers jsonb,
  add column if not exists parq_date    timestamptz;

comment on column public.participants.parq_answers is
  'PAR-Q as applied: version, answered_at, answers per question, yes_count, outcome, threshold.';
comment on column public.participants.parq_date is
  'Timestamp of the PAR-Q application. Null for participants enrolled before this was recorded.';
