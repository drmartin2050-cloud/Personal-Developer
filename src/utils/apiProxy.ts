import { evaluateCORS } from './corsHandler';

/**
 * Executes a fetch request with an automatic transparent CORS proxy fallback
 * if evaluated as unsafe or blocked by standard browser policies.
 */
export async function proxyFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const corsEval = evaluateCORS(url);

  if (!corsEval.requiresProxy) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      console.warn(`Direct fetch failed for ${url}. Triggering fallback proxy tunnel...`, err);
    }
  }

  // Fallback CORS high-availability proxies for browser apps
  const proxies = [
    (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
    (target: string) => target // Bypass fallback
  ];

  let lastError: Error | null = null;
  for (const getProxyUrl of proxies) {
    const proxiedUrl = getProxyUrl(url);
    try {
      // For proxy fetches, some proxy providers do not allow custom options/headers inside authorization blocks 
      // or require careful configuration.
      const response = await fetch(proxiedUrl, {
        ...options,
        // Ensure request is read correctly by target server
        mode: 'cors',
      });
      
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Proxy tunnel failed with ${proxiedUrl}:`, err.message || err);
    }
  }

  // If all proxy gateways fail, attempt one final direct fetch as an absolute failover
  try {
    return await fetch(url, options);
  } catch (err) {
    throw lastError || new Error(`All CORS tunnel proxies and direct routes failed for URL: ${url}`);
  }
}
