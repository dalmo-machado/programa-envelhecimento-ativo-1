import { createClient } from '@supabase/supabase-js';

// Vite exposes VITE_* env vars via import.meta.env at build time.
// The cast avoids the tsconfig "types: ['node']" clash with ImportMeta.
const env = (import.meta as any).env as Record<string, string>;

const supabaseUrl  = env.VITE_SUPABASE_URL  ?? '';
const supabaseKey  = env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Running in offline mode.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
