import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tsgsgfsaavezdcpqqkpy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BCaKYkBRnJnkM8QJtDgDQw_mHHBva00';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testSupabaseConnection(): Promise<{ 
  ok: boolean; 
  message: string; 
  latencyMs?: number;
  version?: string;
  service?: string;
}> {
  const start = performance.now();
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    const latencyMs = Math.round(performance.now() - start);

    if (response.ok && response.status === 200) {
      const data = await response.json();
      return {
        ok: true,
        message: `Successfully connected to Supabase (${data.name || 'GoTrue'} ${data.version || ''}) in ${latencyMs}ms`,
        latencyMs,
        version: data.version,
        service: data.name,
      };
    } else {
      return {
        ok: false,
        message: `Supabase returned HTTP ${response.status}: ${response.statusText}`,
        latencyMs,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      message: `Failed to connect to Supabase: ${err.message || 'Network error'}`,
    };
  }
}
