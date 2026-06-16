// Delegate all Supabase client operations to standard lib location to avoid dual-state initialization
export { 
  isSupabaseConnected, 
  getSupabaseClient, 
  initializeDynamicSupabase 
} from '../lib/supabase';
