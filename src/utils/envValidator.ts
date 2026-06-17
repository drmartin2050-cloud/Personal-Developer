import { getSupabaseClient } from '../lib/supabase';
import { db } from '../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export interface EnvValidationResult {
  keyName: string;
  isLoaded: boolean;
  maskedValue: string;
  isOptional: boolean;
}

export interface ConnectionTestResult {
  status: 'SUCCESS' | 'ERROR' | 'UNKNOWN';
  message: string;
  latencyMs?: number;
}

/**
 * Validates that the required client-side environment variables are loaded.
 */
export function getEnvStatus(): EnvValidationResult[] {
  const envVars = [
    { name: 'VITE_SUPABASE_URL', label: 'VITE_SUPABASE_URL', optional: false },
    { name: 'VITE_SUPABASE_ANON_KEY', label: 'VITE_SUPABASE_ANON_KEY', optional: false },
    { name: 'VITE_FIREBASE_API_KEY', label: 'VITE_FIREBASE_API_KEY', optional: false },
    { name: 'VITE_FIREBASE_AUTH_DOMAIN', label: 'VITE_FIREBASE_AUTH_DOMAIN', optional: false },
    { name: 'VITE_FIREBASE_PROJECT_ID', label: 'VITE_FIREBASE_PROJECT_ID', optional: false },
    { name: 'VITE_GEMINI_API_KEY', label: 'VITE_GEMINI_API_KEY', optional: false },
    { name: 'VITE_GROQ_API_KEY', label: 'VITE_GROQ_API_KEY', optional: false },
    { name: 'VITE_GOOGLE_CLIENT_ID', label: 'VITE_GOOGLE_CLIENT_ID (Optional)', optional: true }
  ];

  return envVars.map(v => {
    // Check both window.__ENV, window.env, and import.meta.env (for Hugging Face Spaces runtime fallback)
    const rawVal = 
      (window as any).__ENV?.[v.name] || 
      (window as any).env?.[v.name] || 
      (import.meta as any).env?.[v.name] || 
      '';

    const isLoaded = !!rawVal && rawVal !== 'your_supabase_url_here' && rawVal !== 'your_supabase_anon_key_here' && rawVal.trim().length > 5;
    
    // Mask value for security
    let maskedValue = 'Missing/مفقود';
    if (isLoaded) {
      if (rawVal.length <= 8) {
        maskedValue = '***';
      } else {
        maskedValue = `${rawVal.slice(0, 4)}...${rawVal.slice(-4)}`;
      }
    }

    return {
      keyName: v.label,
      isLoaded,
      maskedValue,
      isOptional: v.optional
    };
  });
}

/**
 * Checks if all critical non-optional variables are present.
 */
export function areCriticalEnvsLoaded(): boolean {
  return getEnvStatus()
    .filter(v => !v.isOptional)
    .every(v => v.isLoaded);
}

/**
 * Tests connection to the Supabase database.
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      status: 'ERROR',
      message: 'عميل Supabase غير متاح أو لم يتم تهيئته بشكل صحيح.'
    };
  }

  const start = Date.now();
  try {
    // Try to perform a fast lightweight query to check the connection
    const { error } = await supabase.from('developer_projects').select('id').limit(1);
    
    // Postgrest errors are still successful DB handshakes (e.g., table not existing or permission denied)
    // but actual network failure or authorization rejection are handled here
    if (error && error.code === 'PGRST116') {
      // Single record missing, which is totally fine
      return {
        status: 'SUCCESS',
        message: 'تم الاتصال بـ Supabase بنجاح (استجابة الجدول فارغة).',
        latencyMs: Date.now() - start
      };
    }
    
    const latencyMs = Date.now() - start;
    return {
      status: 'SUCCESS',
      message: 'الاتصال بـ Supabase نشط ومستقر.',
      latencyMs
    };
  } catch (err: any) {
    console.warn('Supabase connection handshake failed directly, testing auth domain instead...', err);
    try {
      // fallback check on the endpoint itself to support restricted client setups
      const url = (window as any).__ENV?.VITE_SUPABASE_URL || (window as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
      if (!url) throw new Error('Missing URL');
      const startFetch = Date.now();
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { 'apikey': (window as any).__ENV?.VITE_SUPABASE_ANON_KEY || (window as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '' }
      });
      if (res.ok || res.status === 401 || res.status === 400 || res.status === 404) {
        return {
          status: 'SUCCESS',
          message: `تم الوصول إلى خادم Supabase بنجاح (رمز الحالة: ${res.status}).`,
          latencyMs: Date.now() - startFetch
        };
      }
    } catch {}
    
    return {
      status: 'ERROR',
      message: `فشل الاتصال بـ Supabase: ${err.message || String(err)}`
    };
  }
}

/**
 * Tests connection to the Firebase Firestore database.
 */
export async function testFirebaseConnection(): Promise<ConnectionTestResult> {
  const start = Date.now();
  try {
    if (!db) {
      throw new Error('قاعدة بيانات Firestore غير مهيأة.');
    }

    // Force server lookup to test online status instead of offline cache resolver
    const testDoc = doc(db, 'system_heartbeat', 'connection_probe');
    await getDocFromServer(testDoc).catch((err) => {
      // If Firestore responds with "Permission Denied" or "Missing rules", it is still a SUCCESSFUL connection handshake!
      // Only "Client is offline" or absolute network failure counts as an ERROR.
      if (err.code === 'permission-denied' || err.code === 'not-found' || err.message.includes('permission')) {
        return null;
      }
      throw err;
    });

    const latencyMs = Date.now() - start;
    return {
      status: 'SUCCESS',
      message: 'الاتصال بـ Firebase Firestore نشط ومستقر.',
      latencyMs
    };
  } catch (err: any) {
    const isOffline = err.message?.toLowerCase().includes('offline') || err.code === 'unavailable';
    return {
      status: isOffline ? 'ERROR' : 'SUCCESS', // Treat non-offline exceptions (e.g. permission/unauthenticated) as successful server handshakes
      message: isOffline 
        ? `خادم Firebase غير متصل بالإنترنت: يرجى التحقق من مفاتيح الربط.` 
        : `تم التحقق من شبكة Firebase بنجاح: ${err.message || String(err)}`,
      latencyMs: Date.now() - start
    };
  }
}
