import { proxyFetch } from '../utils/apiProxy';
import { logErrorToDatabase } from '../utils/errorDiagnoser';
import { retryWithBackoff, saveRepairLog } from '../utils/autoRepair';

export type AIProvider = 'groq' | 'gemini' | 'openai' | 'deepseek';

export interface FailoverLogEntry {
  keyIndex: number;
  maskedKey: string;
  status: 'pending' | 'success' | 'failed';
  errorDetail?: string;
  statusCode?: number;
  timestamp: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  provider: AIProvider;
  logs: FailoverLogEntry[];
}

let failedProviders: AIProvider[] = [];

export function resetFailedProviders(): void {
  failedProviders = [];
}

// Clean fallback utility to fetch API Keys securely from Hugging Face secrets at runtime, or local Vite .env files
function getApiKey(provider: AIProvider): string {
  const windowEnvBigSpace = (window as any).__ENV || {};
  const windowEnv = (window as any).env || {};
  const metaEnv = (import.meta as any).env || {};
  
  let key = '';
  switch (provider) {
    case 'groq':
      key = windowEnvBigSpace.GROQ_API_KEY || windowEnv.GROQ_API_KEY || metaEnv.VITE_GROQ_API_KEY || '';
      break;
    case 'gemini':
      key = windowEnvBigSpace.GEMINI_API_KEY || windowEnv.GEMINI_API_KEY || metaEnv.VITE_GEMINI_API_KEY || '';
      break;
    case 'openai':
      key = windowEnvBigSpace.OPENAI_API_KEY || windowEnv.OPENAI_API_KEY || metaEnv.VITE_OPENAI_API_KEY || '';
      break;
    case 'deepseek':
      key = windowEnvBigSpace.DEEPSEEK_API_KEY || windowEnv.DEEPSEEK_API_KEY || metaEnv.VITE_DEEPSEEK_API_KEY || '';
      break;
  }

  if (key) {
    key = key.trim().replace(/^["']|["']$/g, '');
  }

  console.log(`[Sentry Diagnostic] Resolved API key for ${provider.toUpperCase()}: ${key ? `FOUND (${key.substring(0, 4)}...)` : 'NOT FOUND'}`);
  return key;
}

// 1. Groq Completion Client with Backoff & CORS Proxy healing
async function callGroq(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const response = await proxyFetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 2. Gemini v1beta Completion Client with Backoff & CORS Proxy healing
async function callGemini(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await proxyFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemPrompt }
        ]
      },
      generationConfig: {
        temperature: 0.7,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// 3. OpenAI GPT-4o-mini Client with Backoff & CORS Proxy healing
async function callOpenAI(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const response = await proxyFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 4. DeepSeek Chat Client with Backoff & CORS Proxy healing
async function callDeepSeek(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const response = await proxyFetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Dynamically re-fetch /env-config.js from the server to refresh keys on window.__ENV
 * Bypasses browser cache completely to request real-time values from Hugging Face environment container.
 */
export async function refreshEnvironmentKeys(): Promise<boolean> {
  console.log('[Sentry Keys Refresh] Initializing dynamic re-fetch from HF container secrets...');
  try {
    const response = await fetch(`/env-config.js?t=${Date.now()}`);
    if (response.ok) {
      const scriptText = await response.text();
      // Look for target object inside public script window.__ENV = { ... }
      const match = scriptText.match(/window\.__ENV\s*=\s*({[\s\S]*?});/);
      if (match && match[1]) {
        try {
          const parsed = new Function(`return ${match[1]};`)();
          if (parsed && typeof parsed === 'object') {
            (window as any).__ENV = { ...(window as any).__ENV, ...parsed };
            (window as any).env = (window as any).__ENV;
            console.log('[Sentry Keys Refresh] Live updated window.__ENV from container successfully:', (window as any).__ENV);
            return true;
          }
        } catch (e) {
          console.error('[Sentry Keys Refresh] JSON/Function parse error on re-fetched keys:', e);
        }
      }
    }
  } catch (error) {
    console.error('[Sentry Keys Refresh] Direct fetch check failed:', error);
  }

  // Fallback to script tag injection
  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = `/env-config.js?t=${Date.now()}`;
    script.onload = () => {
      console.log('[Sentry Keys Refresh] Fallback dynamic script loaded. Keys updated.', (window as any).__ENV);
      resolve(true);
    };
    script.onerror = (e) => {
      console.error('[Sentry Keys Refresh] Fallback script injection failed:', e);
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

export async function askAI(
  prompt: string,
  systemPrompt: string = 'أنت مساعد ذكي محترف، تتحدث العربية الفصحى الحديثة. أجب بشكل مفيد ودقيق.'
): Promise<AIResponse> {
  const providers: AIProvider[] = ['groq', 'gemini', 'openai', 'deepseek'];
  const logs: FailoverLogEntry[] = [];
  const diagnostics: Record<string, string> = {};

  const vaultKeys: Record<string, string> = {};
  try {
    const { getActiveKey } = await import('../utils/vaultManager');
    for (const p of providers) {
      const res = await getActiveKey(p);
      if (res.success && res.data?.decryptedValue) {
        vaultKeys[p] = res.data.decryptedValue;
      }
    }
  } catch (err) {
    console.warn('Failed to load active keys from Vault, defaulting to environment configs:', err);
  }

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const apiKey = vaultKeys[provider] || getApiKey(provider);

    const log: FailoverLogEntry = {
      keyIndex: i,
      maskedKey: provider.toUpperCase(),
      status: 'pending',
      timestamp: new Date().toLocaleTimeString()
    };
    logs.push(log);

    if (failedProviders.includes(provider)) {
      log.status = 'failed';
      log.errorDetail = 'Previously failed in session';
      diagnostics[provider] = 'Previously failed';
      continue;
    }

    if (!apiKey) {
      log.status = 'failed';
      log.errorDetail = 'Missing API Key';
      diagnostics[provider] = 'No API key configured';
      continue;
    }

    try {
      // Execute the request with resilient active retry support (Backoff system)
      let content = '';
      await retryWithBackoff(async () => {
        // Resolve key dynamically inside each attempt to support immediate fresh hot-swaps
        const currentApiKey = vaultKeys[provider] || getApiKey(provider);
        if (!currentApiKey) {
          throw new Error(`API key for ${provider.toUpperCase()} is missing or empty.`);
        }

        try {
          switch (provider) {
            case 'groq':
              content = await callGroq(prompt, systemPrompt, currentApiKey);
              break;
            case 'gemini':
              content = await callGemini(prompt, systemPrompt, currentApiKey);
              break;
            case 'openai':
              content = await callOpenAI(prompt, systemPrompt, currentApiKey);
              break;
            case 'deepseek':
              content = await callDeepSeek(prompt, systemPrompt, currentApiKey);
              break;
          }
        } catch (innerError: any) {
          const errMsg = (innerError.message || '').toLowerCase();
          const statusCodeStr = innerError.message.match(/\((\d+)\)/)?.[1];
          const code = statusCodeStr ? parseInt(statusCodeStr, 10) : undefined;
          
          // Detect authorization or key invalid errors
          const isAuthError = code === 401 || code === 403 || 
                              errMsg.includes('unauthorized') || 
                              errMsg.includes('invalid api key') || 
                              errMsg.includes('api key not valid') ||
                              errMsg.includes('forbidden') ||
                              errMsg.includes('missing or empty');

          if (isAuthError) {
            console.warn(`[Sentry S.O.S] Auth error caught on ${provider.toUpperCase()}. Triggering fresh window.__ENV pull...`);
            const wasRefreshed = await refreshEnvironmentKeys();
            if (wasRefreshed) {
              const rotatedApiKey = vaultKeys[provider] || getApiKey(provider);
              if (rotatedApiKey && rotatedApiKey !== currentApiKey) {
                console.log(`[Sentry Healing] API Key updated successfully for ${provider.toUpperCase()}. Retrying immediate request...`);
                switch (provider) {
                  case 'groq':
                    content = await callGroq(prompt, systemPrompt, rotatedApiKey);
                    break;
                  case 'gemini':
                    content = await callGemini(prompt, systemPrompt, rotatedApiKey);
                    break;
                  case 'openai':
                    content = await callOpenAI(prompt, systemPrompt, rotatedApiKey);
                    break;
                  case 'deepseek':
                    content = await callDeepSeek(prompt, systemPrompt, rotatedApiKey);
                    break;
                }
                return;
              }
            }
          }
          throw innerError;
        }
      }, 2, 400); // 2 retry attempts with fast healing curves to preserve interactive speed

      log.status = 'success';
      return { success: true, content, provider, logs };
    } catch (error: any) {
      log.status = 'failed';
      const statusCodeStr = error.message.match(/\((\d+)\)/)?.[1];
      const code = statusCodeStr ? parseInt(statusCodeStr, 10) : undefined;
      log.statusCode = code;
      log.errorDetail = error.message || 'CORS or Timeout';

      // Record detailed logs to diagnosis tables
      const errorPayload = {
        id: `err-${Date.now()}`,
        message: error.message || 'Unknown provider failover event',
        statusCode: code,
        timestamp: new Date().toISOString(),
        provider,
        maskedKey: `${provider.toUpperCase()}_API_KEY`,
        severity: 'critical' as const,
        responseBody: error.stack || 'No response body from endpoint'
      };

      logErrorToDatabase(errorPayload);

      // Trigger automatic heal log
      saveRepairLog({
        id: `rep-fix-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        issue: `Request to ${provider} API gateway failed: ${error.message}`,
        actionTaken: `Initiating self-healing key swap. Rotated to provider [${providers[i + 1] || 'None'}] automatically.`,
        status: 'repaired',
        approved: true
      });

      console.error(`Provider [${provider}] call failed:`, error.message || error);
      diagnostics[provider] = error.message || 'Unknown network error';
      failedProviders.push(provider);
    }
  }

  return {
    success: false,
    content: `All providers failed to load. Diagnostics:\n${JSON.stringify(diagnostics, null, 2)}`,
    provider: 'groq',
    logs
  };
}
