/**
 * Smart API Key Failover Utility
 * 
 * Automatically rolls over to backup API keys when encountering rate limits
 * or auth limitations (HTTP Codes: 429, 401, 403).
 */

export interface FailoverLogEntry {
  keyIndex: number;
  maskedKey: string;
  status: 'pending' | 'success' | 'failed';
  errorDetail?: string;
  statusCode?: number;
  timestamp: string;
}

export interface FailoverResult<T = any> {
  success: boolean;
  activeKeyUsed: string;
  activeKeyIndex: number;
  response: T | null;
  logs: FailoverLogEntry[];
}

/**
 * Executes an HTTP POST with smart rollover API key failover.
 * Retries on 401 (Unauthorized), 403 (Forbidden), or 429 (Too Many Requests).
 * 
 * @param url Target endpoint URL (e.g. n8n webhook or model wrapper)
 * @param payload Payload object to transmit
 * @param keysArray List of API keys or authorization tokens
 * @param headerName Optional custom header designation (default is Authorization)
 */
export async function executeWithFailover<T = any>(
  url: string,
  payload: any,
  keysArray: string[],
  headerName: string = 'Authorization'
): Promise<FailoverResult<T>> {
  const logs: FailoverLogEntry[] = [];
  
  // Guard for empty keys list
  if (!keysArray || keysArray.length === 0) {
    return {
      success: false,
      activeKeyUsed: '',
      activeKeyIndex: -1,
      response: null,
      logs: [{
        keyIndex: -1,
        maskedKey: 'No keys registered',
        status: 'failed',
        errorDetail: 'No API keys stored in system key list or Supabase database.',
        timestamp: new Date().toLocaleTimeString()
      }]
    };
  }

  for (let i = 0; i < keysArray.length; i++) {
    const rawKey = keysArray[i];
    const masked = rawKey.length > 8 
      ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`
      : '***';

    logs.push({
      keyIndex: i,
      maskedKey: masked,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString()
    });

    try {
      // Build dynamic Authorization schema
      const authHeaderValue = rawKey.startsWith('Bearer ') || rawKey.startsWith('Basic ') || rawKey.startsWith('ApiKey ')
        ? rawKey 
        : `Bearer ${rawKey}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Assign custom auth header or default Authorization
      headers[headerName] = authHeaderValue;

      const activeLog = logs[logs.length - 1];

      // Execute request with short timeout limit to prevent infinite hangs
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(id);
      activeLog.statusCode = res.status;

      // Check for auth or rate limit errors
      if (res.status === 429 || res.status === 401 || res.status === 403) {
        const errText = await res.text().catch(() => 'No response body');
        activeLog.status = 'failed';
        activeLog.errorDetail = `Key rejected with status ${res.status}. Response: ${errText}`;
        console.warn(`[Failover Core] Key ${i} (${masked}) failed with status ${res.status}. Rotating...`);
        continue; // Try next key
      }

      // Check other errors
      if (!res.ok) {
        const errText = await res.text().catch(() => 'No response body');
        activeLog.status = 'failed';
        activeLog.errorDetail = `HTTP ${res.status}: ${errText}`;
        console.warn(`[Failover Core] Key ${i} failed. Status: ${res.status}`);
        continue; // Over-engineered failover allows retry on other bad requests as well!
      }

      // Success!
      const contentType = res.headers.get('content-type') || '';
      let resData: any = null;
      if (contentType.includes('application/json')) {
        resData = await res.json();
      } else {
        resData = { text: await res.text() };
      }

      activeLog.status = 'success';
      
      return {
        success: true,
        activeKeyUsed: rawKey,
        activeKeyIndex: i,
        response: resData,
        logs
      };

    } catch (err: any) {
      const activeLog = logs[logs.length - 1];
      activeLog.status = 'failed';
      activeLog.errorDetail = err.name === 'AbortError' 
        ? 'Request timed out after 9 seconds.' 
        : err.message || 'Network connectivity error';
      
      console.warn(`[Failover Core] Key ${i} threw exception: ${err.message}. Rotating...`);
      // Automatically triggers loop rollover
    }
  }

  // All keys depleted
  return {
    success: false,
    activeKeyUsed: '',
    activeKeyIndex: -1,
    response: null,
    logs
  };
}
