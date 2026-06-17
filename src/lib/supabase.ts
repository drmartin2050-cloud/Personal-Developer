import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load credentials optionally from env variables
const ENV_SUPABASE_URL = 
  ((window as any).__ENV?.VITE_SUPABASE_URL as string) || 
  ((window as any).__ENV?.SUPABASE_URL as string) || 
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 
  ((window as any).env?.VITE_SUPABASE_URL as string) || 
  ((window as any).env?.SUPABASE_URL as string) || 
  '';
const ENV_SUPABASE_ANON_KEY = 
  ((window as any).__ENV?.VITE_SUPABASE_ANON_KEY as string) || 
  ((window as any).__ENV?.SUPABASE_ANON_KEY as string) || 
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 
  ((window as any).env?.VITE_SUPABASE_ANON_KEY as string) || 
  ((window as any).env?.SUPABASE_ANON_KEY as string) || 
  '';

let activeClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

try {
  if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY && ENV_SUPABASE_URL !== 'your_supabase_url_here') {
    activeClient = createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    lastUrl = ENV_SUPABASE_URL;
    lastKey = ENV_SUPABASE_ANON_KEY;
  }
} catch (error) {
  console.warn('Supabase client failed to initialize securely:', error);
}

/**
 * Checks if Supabase client is connected and active.
 */
export function isSupabaseConnected(): boolean {
  return activeClient !== null;
}

/**
 * Get the active Supabase client instance.
 * Returns null if credentials are not configured or failed to resolve.
 */
export function getSupabaseClient(): SupabaseClient | null {
  return activeClient;
}

/**
 * Initialize or update the Supabase client dynamically at runtime.
 */
export function initializeDynamicSupabase(url: string, key: string): boolean {
  try {
    if (!url || !key) return false;
    
    // Avoid double-instantiating identical client parameters
    if (activeClient && url === lastUrl && key === lastKey) {
      return true;
    }

    activeClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    lastUrl = url;
    lastKey = key;
    return true;
  } catch (error) {
    console.error('Dynamic initialization of Supabase failed:', error);
    return false;
  }
}
