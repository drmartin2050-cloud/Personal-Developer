import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load credentials optionally from env variables
const ENV_SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const ENV_SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

// We can allow users to temporarily input credentials in session memory if env keys are not present
let activeClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

try {
  if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) {
    activeClient = createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY);
    lastUrl = ENV_SUPABASE_URL;
    lastKey = ENV_SUPABASE_ANON_KEY;
  }
} catch (error) {
  console.warn('Supabase client failed to initialize due to invalid configuration:', error);
}

/**
 * Checks if Supabase client is initialized.
 */
export function isSupabaseConnected(): boolean {
  return activeClient !== null;
}

/**
 * Get the active Supabase client or null
 */
export function getSupabaseClient(): SupabaseClient | null {
  return activeClient;
}

/**
 * Initialize Supabase client dynamically at runtime (e.g. if the developer on their phone
 * inputs connection keys directly inside the HUD Settings panel)
 */
export function initializeDynamicSupabase(url: string, key: string): boolean {
  try {
    if (!url || !key) return false;
    
    // Avoid double-instantiating the same client and raising GoTrueClient warnings
    if (activeClient && url === lastUrl && key === lastKey) {
      return true;
    }

    activeClient = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return true;
  } catch (error) {
    console.error('Dynamic initialization of Supabase failed:', error);
    return false;
  }
}
