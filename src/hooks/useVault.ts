import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase';
import { decryptText } from '../utils/crypto';

export interface VaultKey {
  id: string;
  platform: string;
  api_key: string;
  status: string;
  balance: number;
}

export function useVault(platformName: string) {
  const [apiKey, setApiKey] = useState<string>('');
  const [activeCredential, setActiveCredential] = useState<VaultKey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch credentials from Supabase on initialize
  useEffect(() => {
    async function loadKey() {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        // Safe offline placeholder matching default keys for the user session
        const masterKey = sessionStorage.getItem('dev_hub_master_token') || 'Eissa2026';
        const fallbackKeys: Record<string, string> = {
          'OpenAI': 'sk-proj-DEMO_OPENAI_KEY_LEVEL_ACTIVE_882910398',
          'Google': 'AIzaSyDEMO_GEMINI_KEY_ACTIVE_3321_GOOD9',
          'Anthropic': 'sk-ant-DEMO_CLAUDE_KEY_ACTIVE_4412_OK',
        };
        const sampleKey = fallbackKeys[platformName] || `sk-custom-demo-${platformName}`;
        setApiKey(sampleKey);
        setLoading(false);
        return;
      }

      try {
        // Query Supabase for active key
        const { data, error: queryErr } = await supabase
          .from('vault_credentials')
          .select('*')
          .eq('platform', platformName)
          .eq('status', 'active')
          .gt('balance', 0)
          .order('balance', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (queryErr) {
          // Alternative fallback matching old developer_credentials schema if custom table fails
          const { data: altData } = await supabase
            .from('developer_credentials')
            .select('*')
            .limit(5);

          if (altData && altData.length > 0) {
            // Found secondary match, map it
            const matched = altData.find(item => 
              (item.service_name || '').toLowerCase().includes(platformName.toLowerCase())
            );
            
            if (matched) {
              const masterPw = sessionStorage.getItem('dev_hub_master_token') || 'Eissa2026';
              const rawKey = decryptText(matched.api_token || matched.apiToken || '', masterPw);
              setApiKey(rawKey);
              setActiveCredential({
                id: String(matched.id),
                platform: platformName,
                api_key: matched.api_token || '',
                status: 'active',
                balance: 100.00
              });
              setLoading(false);
              return;
            }
          }
          throw queryErr;
        }

        if (data) {
          const masterPw = sessionStorage.getItem('dev_hub_master_token') || 'Eissa2026';
          const decryptedKey = decryptText(data.api_key || '', masterPw) || data.api_key;
          setApiKey(decryptedKey);
          setActiveCredential({
            id: String(data.id),
            platform: data.platform,
            api_key: data.api_key,
            status: data.status,
            balance: Number(data.balance || 0)
          });
        } else {
          // Elegant default demo fallbacks for local sandbox environment
          const fallbackKeys: Record<string, string> = {
            'OpenAI': 'sk-proj-DEMO_OPENAI_KEY_LEVEL_ACTIVE_882910398',
            'Google': 'AIzaSyDEMO_GEMINI_KEY_ACTIVE_3321_GOOD9',
            'Anthropic': 'sk-ant-DEMO_CLAUDE_KEY_ACTIVE_4412_OK',
          };
          setApiKey(fallbackKeys[platformName] || `demo-fallback-${platformName}-key`);
        }
      } catch (err: any) {
        console.warn(`Vault search failed for ${platformName}, running on local session:`, err.message);
        setError(err.message);
        // Default local key
        setApiKey(`sk-offline-${platformName}-local-sec`);
      } finally {
        setLoading(false);
      }
    }
    loadKey();
  }, [platformName]);

  // consumes credentials, updates balance, and logs usage
  const consumeTokens = async (amount: number, cost: number) => {
    const supabase = getSupabaseClient();
    if (!activeCredential) {
      console.warn('Sandbox Simulation: logging mock usage locally:', { amount, cost });
      return;
    }

    try {
      const parentId = activeCredential.id;
      const newBalance = Math.max(0, activeCredential.balance - cost);

      if (supabase) {
        // 1. Insert logs to credentials usage
        await supabase
          .from('credential_usage_logs')
          .insert({
            credential_id: parentId,
            tokens_used: amount,
            cost: cost,
            model: `${platformName}-Active-Hook`,
            timestamp: new Date().toISOString()
          });

        // 2. Decrement balance on credentials table
        await supabase
          .from('vault_credentials')
          .update({ 
            balance: newBalance,
            last_used_at: new Date().toISOString()
          })
          .eq('id', parentId);

        // Update local hook state
        setActiveCredential(prev => prev ? { ...prev, balance: newBalance } : null);
      }
    } catch (err) {
      console.error('Error logging database transaction or updating balance:', err);
    }
  };

  return {
    apiKey,
    activeCredential,
    loading,
    error,
    consumeTokens
  };
}
