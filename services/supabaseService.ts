/**
 * Supabase persistence layer.
 *
 * Column-name mapping (DB ↔ app internal):
 *   balance_seconds          ↔  balance_s
 *   flexibility_cm           ↔  back_scratch_cm
 *   calf_circumference_cm    ↔  calf_circum_cm
 *   alometric_index          ↔  cc_bmi_index
 *   waist_cm                 ↔  cintura_cm
 *   hip_cm                   ↔  quadril_cm
 *   body_fat_percent         ↔  gordura_percent
 *   six_min_walk_percent_predicted ↔ six_min_walk_percent
 *
 * Fields not in DB:
 *   whoqol_total   → not stored in Supabase
 *   six_min_walk_predicted → calculated, not stored
 *   moment         → not tracked by app (default null)
 */

import { supabase } from '../lib/supabase';
import { Assessment, AssessmentRecord, IncidentReport, Language, Participant, SessionLog } from '../types';

// ─────────────────────────────────────────────
//  Row-type helpers
// ─────────────────────────────────────────────

function assessmentToDb(record: AssessmentRecord, participantId: string): Record<string, unknown> {
  const d = record.data;
  return {
    participant_id: participantId,
    date: record.date,
    grip_kgf: d.grip_kgf,
    handgrip_nondominant_kgf: d.handgrip_nondominant_kgf ?? null,
    balance_seconds: d.balance_s,
    flexibility_cm: d.back_scratch_cm,
    weight_kg: d.weight_kg,
    height_cm: d.height_cm,
    calf_circumference_cm: d.calf_circum_cm,
    bmi: d.bmi,
    alometric_index: d.cc_bmi_index,
    waist_cm: d.cintura_cm ?? null,
    hip_cm: d.quadril_cm ?? null,
    body_fat_percent: d.gordura_percent ?? null,
    rcq: d.rcq ?? null,
    chair_stand_reps: d.chair_stand_reps ?? null,
    arm_curl_reps: d.arm_curl_reps ?? null,
    chair_sit_reach_cm: d.chair_sit_reach_cm ?? null,
    up_and_go_seconds: d.up_and_go_seconds ?? null,
    six_min_walk_meters: d.six_min_walk_meters ?? null,
    six_min_walk_percent_predicted: d.six_min_walk_percent ?? null,
  };
}

function dbToAssessmentRecord(row: Record<string, any>): AssessmentRecord {
  return {
    date: row.date as string,
    data: {
      grip_kgf: row.grip_kgf ?? 0,
      handgrip_nondominant_kgf: row.handgrip_nondominant_kgf ?? undefined,
      balance_s: row.balance_seconds ?? 0,
      back_scratch_cm: row.flexibility_cm ?? 0,
      weight_kg: row.weight_kg ?? 0,
      height_cm: row.height_cm ?? 0,
      calf_circum_cm: row.calf_circumference_cm ?? 0,
      bmi: row.bmi ?? 0,
      cc_bmi_index: row.alometric_index ?? 0,
      cintura_cm: row.waist_cm ?? undefined,
      quadril_cm: row.hip_cm ?? undefined,
      gordura_percent: row.body_fat_percent ?? undefined,
      rcq: row.rcq ?? undefined,
      chair_stand_reps: row.chair_stand_reps ?? undefined,
      arm_curl_reps: row.arm_curl_reps ?? undefined,
      chair_sit_reach_cm: row.chair_sit_reach_cm ?? undefined,
      up_and_go_seconds: row.up_and_go_seconds ?? undefined,
      six_min_walk_meters: row.six_min_walk_meters ?? undefined,
      six_min_walk_percent: row.six_min_walk_percent_predicted ?? undefined,
      whoqol_total: 0,
    } as Assessment,
  };
}

function incidentToDb(inc: IncidentReport, participantId: string): Record<string, unknown> {
  return {
    id: inc.id,
    participant_id: participantId,
    session_index: inc.session_index,
    reported_date: inc.reported_date,
    reviewed: inc.reviewed,
    occurrence_description: inc.occurrence_description ?? null,
    action_taken: inc.action_taken ?? null,
  };
}

function dbToIncident(row: Record<string, any>): IncidentReport {
  return {
    id: row.id as string,
    session_index: row.session_index as number,
    reported_date: row.reported_date as string,
    reviewed: row.reviewed as boolean,
    occurrence_description: row.occurrence_description ?? undefined,
    action_taken: row.action_taken ?? undefined,
  };
}

function participantToDb(p: Participant): Record<string, unknown> {
  return {
    study_id: p.study_id,
    name: p.name,
    sex: p.sex,
    birth_date: p.birth_date,
    site: p.site,
    language: p.language,
    consent_date: p.consent_date,
    sessions_completed: p.sessions_completed,
    training_plan: p.training_plan,
    session_logs: p.session_logs ?? [],
  };
}

// ─────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────

/**
 * Load ALL participants with their assessments and incidents in one batch.
 * Returns an empty array and throws if the network call fails.
 */
export async function loadAllParticipants(): Promise<Participant[]> {
  const [pRes, aRes, iRes] = await Promise.all([
    supabase.from('participants').select('*'),
    supabase.from('assessments').select('*').order('date', { ascending: true }),
    supabase.from('incidents').select('*').order('reported_date', { ascending: true }),
  ]);

  if (pRes.error) throw pRes.error;

  const participants: Participant[] = (pRes.data ?? []).map((row: Record<string, any>) => {
    const assessments = (aRes.data ?? [])
      .filter((a: Record<string, any>) => a.participant_id === row.study_id)
      .map(dbToAssessmentRecord);

    const incidents = (iRes.data ?? [])
      .filter((i: Record<string, any>) => i.participant_id === row.study_id)
      .map(dbToIncident);

    return {
      study_id: row.study_id,
      name: row.name,
      sex: row.sex as 'M' | 'F' | 'Other',
      birth_date: row.birth_date,
      site: row.site as 'Brazil' | 'Spain',
      language: row.language as Language,
      consent_date: row.consent_date,
      sessions_completed: row.sessions_completed ?? 0,
      assessments,
      incidents,
      training_plan: Array.isArray(row.training_plan) ? row.training_plan : [],
      session_logs: Array.isArray(row.session_logs) ? (row.session_logs as SessionLog[]) : [],
    };
  });

  return participants;
}

/**
 * Insert a brand-new participant (no assessments yet).
 */
export async function syncAddParticipant(p: Participant): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .upsert(participantToDb(p), { onConflict: 'study_id' });
  if (error) throw error;
}

/**
 * Smart sync: only push the fields that actually changed.
 */
export async function syncUpdate(
  participantId: string,
  old: Participant,
  changes: Partial<Participant>,
): Promise<void> {
  const ops: PromiseLike<unknown>[] = [];

  // ── Core participant row ──────────────────────────────────────────────────
  const coreKeys: (keyof Participant)[] = [
    'name', 'sex', 'birth_date', 'site', 'language', 'consent_date', 'sessions_completed',
  ];
  const coreChanges: Record<string, unknown> = {};
  for (const key of coreKeys) {
    if (changes[key] !== undefined && changes[key] !== old[key]) {
      coreChanges[key] = changes[key];
    }
  }
  if (Object.keys(coreChanges).length > 0) {
    ops.push(
      supabase
        .from('participants')
        .update(coreChanges)
        .eq('study_id', participantId)
        .then(({ error }) => { if (error) throw error; }),
    );
  }

  // ── New session record (when sessions_completed increments) ───────────────
  if (
    changes.sessions_completed !== undefined &&
    changes.sessions_completed !== old.sessions_completed &&
    changes.sessions_completed > 0
  ) {
    ops.push(
      supabase
        .from('sessions')
        .insert({
          participant_id: participantId,
          session_index: changes.sessions_completed - 1,
          completed_at: new Date().toISOString(),
          wellness_score: (changes.session_logs ?? []).at(-1)?.wellness_score ?? null,
        })
        .then(({ error }) => { if (error) console.warn('[Supabase] sessions insert:', error); }),
    );
  }

  // ── New assessments (append-only) ─────────────────────────────────────────
  if (changes.assessments && changes.assessments.length > old.assessments.length) {
    const newRecords = changes.assessments.slice(old.assessments.length);
    for (const record of newRecords) {
      ops.push(
        supabase
          .from('assessments')
          .insert(assessmentToDb(record, participantId))
          .then(({ error }) => { if (error) throw error; }),
      );
    }
  }

  // ── Session logs (append-only; sync when new entries are added) ─────────────
  if (changes.session_logs && changes.session_logs.length > (old.session_logs?.length ?? 0)) {
    ops.push(
      supabase
        .from('participants')
        .update({ session_logs: changes.session_logs })
        .eq('study_id', participantId)
        .then(({ error }) => { if (error) throw error; }),
    );
  }

  // ── Training plan (written on first assessment; syncs across devices) ────────
  if (changes.training_plan && changes.training_plan.length > 0) {
    ops.push(
      supabase
        .from('participants')
        .update({ training_plan: changes.training_plan })
        .eq('study_id', participantId)
        .then(({ error }) => { if (error) throw error; }),
    );
  }

  // ── Incidents (upsert all — handles new + reviewed updates) ───────────────
  if (changes.incidents && changes.incidents.length > 0) {
    ops.push(
      supabase
        .from('incidents')
        .upsert(
          changes.incidents.map(inc => incidentToDb(inc, participantId)),
          { onConflict: 'id' },
        )
        .then(({ error }) => { if (error) throw error; }),
    );
  }

  await Promise.all(ops);
}

// ─────────────────────────────────────────────
//  Backup / Restore
// ─────────────────────────────────────────────

export interface BackupData {
  version: number;       // schema version — currently 1
  exported_at: string;   // ISO timestamp
  participants: Participant[];
}

export interface RestoreResult {
  restored: number;
  errors: string[];
}

/**
 * Restore a full backup into Supabase.
 * Designed to run after a full wipe (no conflicts expected).
 * Uses insert (not upsert) for child tables — if rows already exist the
 * error is caught per-participant and reported without aborting the rest.
 */
export async function restoreFromBackup(backup: BackupData): Promise<RestoreResult> {
  if (backup.version !== 1) {
    return { restored: 0, errors: [`Versão de backup não suportada: ${backup.version}`] };
  }

  const errors: string[] = [];
  let restored = 0;

  for (const p of backup.participants) {
    try {
      // 1. Participant row (upsert — safe to re-run)
      const { error: pErr } = await supabase
        .from('participants')
        .upsert(participantToDb(p), { onConflict: 'study_id' });
      if (pErr) throw new Error(`participants: ${pErr.message}`);

      // 2. Assessments (insert; run after wipe so no conflicts)
      for (const record of p.assessments) {
        const { error: aErr } = await supabase
          .from('assessments')
          .insert(assessmentToDb(record, p.study_id));
        if (aErr) errors.push(`assessments[${p.study_id}/${record.date}]: ${aErr.message}`);
      }

      // 3. Sessions — rebuild from session_logs
      const logs = p.session_logs ?? [];
      for (const log of logs) {
        const { error: sErr } = await supabase
          .from('sessions')
          .insert({
            participant_id: p.study_id,
            session_index: log.session_index,
            completed_at: log.session_end ?? log.session_start,
            wellness_score: (log as any).wellness_score ?? null,
          });
        if (sErr) errors.push(`sessions[${p.study_id}/${log.session_index}]: ${sErr.message}`);
      }

      // 4. Incidents
      for (const incident of p.incidents) {
        const { error: iErr } = await supabase
          .from('incidents')
          .insert(incidentToDb(incident, p.study_id));
        if (iErr) errors.push(`incidents[${p.study_id}/${incident.id}]: ${iErr.message}`);
      }

      restored++;
    } catch (err: any) {
      errors.push(`participant[${p.study_id}]: ${err.message}`);
    }
  }

  return { restored, errors };
}

// ─────────────────────────────────────────────
//  Researchers (managed by Gestor)
// ─────────────────────────────────────────────

export interface ResearcherRecord {
  id: string;
  code: string;
  name: string;
  password_hash: string;
  site: string | null;
  active: boolean;
  created_at: string;
}

/** Load all registered researchers ordered by creation date. */
export async function loadResearchers(): Promise<ResearcherRecord[]> {
  const { data, error } = await supabase
    .from('researchers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ResearcherRecord[];
}

/** Find a single active researcher by login code. Returns null if not found. */
export async function findResearcherByCode(code: string): Promise<ResearcherRecord | null> {
  const { data, error } = await supabase
    .from('researchers')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data as ResearcherRecord | null;
}

/** Create a new researcher (Gestor only). */
export async function createResearcher(
  code: string,
  name: string,
  passwordHash: string,
  site: string | null,
): Promise<void> {
  const { error } = await supabase.from('researchers').insert({
    code: code.toUpperCase().trim(),
    name: name.trim(),
    password_hash: passwordHash,
    site: site || null,
    active: true,
  });
  if (error) throw error;
}

/** Toggle a researcher's active status (Gestor only). */
export async function toggleResearcherActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('researchers')
    .update({ active })
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────

/**
 * Bulk-insert mock participants when the DB is empty on first run.
 */
export async function migrateParticipants(participants: Participant[]): Promise<void> {
  for (const p of participants) {
    // upsert so re-running never duplicates
    await supabase
      .from('participants')
      .upsert(participantToDb(p), { onConflict: 'study_id' });

    for (const record of p.assessments) {
      await supabase
        .from('assessments')
        .insert(assessmentToDb(record, p.study_id));
    }

    for (const incident of p.incidents) {
      await supabase
        .from('incidents')
        .upsert(incidentToDb(incident, p.study_id), { onConflict: 'id' });
    }
  }
}
