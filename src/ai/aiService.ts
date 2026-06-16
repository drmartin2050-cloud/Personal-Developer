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
  const windowEnv = (window as any).env || {};
  const metaEnv = (import.meta as any).env || {};
  switch (provider) {
    case 'groq':
      return windowEnv.GROQ_API_KEY || metaEnv.VITE_GROQ_API_KEY || '';
    case 'gemini':
      return windowEnv.GEMINI_API_KEY || metaEnv.VITE_GEMINI_API_KEY || '';
    case 'openai':
      return windowEnv.OPENAI_API_KEY || metaEnv.VITE_OPENAI_API_KEY || '';
    case 'deepseek':
      return windowEnv.DEEPSEEK_API_KEY || metaEnv.VITE_DEEPSEEK_API_KEY || '';
    default:
      return '';
  }
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
        switch (provider) {
          case 'groq':
            content = await callGroq(prompt, systemPrompt, apiKey);
            break;
          case 'gemini':
            content = await callGemini(prompt, systemPrompt, apiKey);
            break;
          case 'openai':
            content = await callOpenAI(prompt, systemPrompt, apiKey);
            break;
          case 'deepseek':
            content = await callDeepSeek(prompt, systemPrompt, apiKey);
            break;
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
