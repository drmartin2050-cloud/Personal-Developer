import { PLATFORMS_DATABASE, PlatformConfig } from '../data/platforms';

export interface KeyDetectionResult {
  detectedPlatform: string;
  detectedKeyType: 'API_KEY' | 'SECRET_KEY' | 'WEBHOOK_URL' | 'AUTH_TOKEN' | 'CONNECTION_STRING' | 'IP_ADDRESS' | string;
  isValidFormat: boolean;
  officialLink: string;
  matchedPrefix: string;
}

/**
 * Robust heuristic-based API Key detection utility
 */
export function detectKeyDetails(keyString: string): KeyDetectionResult {
  const trimmedKey = keyString.trim();
  
  if (!trimmedKey) {
    return {
      detectedPlatform: 'Custom',
      detectedKeyType: 'API_KEY',
      isValidFormat: false,
      officialLink: '',
      matchedPrefix: ''
    };
  }

  // 1. IP address detection
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipRegex.test(trimmedKey)) {
    return {
      detectedPlatform: 'Custom Network',
      detectedKeyType: 'IP_ADDRESS',
      isValidFormat: true,
      officialLink: '',
      matchedPrefix: ''
    };
  }

  // 2. Webhook URL detection (n8n, Base44, generic)
  if (trimmedKey.startsWith('http://') || trimmedKey.startsWith('https://')) {
    let platform = 'Custom Webhook';
    let officialLink = '';
    
    if (trimmedKey.includes('n8n') || trimmedKey.includes('webhook')) {
      platform = 'n8n';
      officialLink = 'https://n8n.io';
    } else if (trimmedKey.includes('base44') || trimmedKey.includes('proxy')) {
      platform = 'Base44';
      officialLink = 'https://base44.com';
    }

    return {
      detectedPlatform: platform,
      detectedKeyType: 'WEBHOOK_URL',
      isValidFormat: true,
      officialLink,
      matchedPrefix: 'http'
    };
  }

  // 3. Match from the comprehensive platforms database
  for (const config of PLATFORMS_DATABASE) {
    if (config.prefix && trimmedKey.startsWith(config.prefix)) {
      // Extra validation on size
      const isSufficientLength = trimmedKey.length >= config.prefix.length + 5;
      return {
        detectedPlatform: config.id,
        detectedKeyType: config.keyType,
        isValidFormat: isSufficientLength,
        officialLink: config.officialLink,
        matchedPrefix: config.prefix
      };
    }
  }

  // 4. Default Heuristic Checks if prefix not matches perfectly
  if (trimmedKey.startsWith('sk-proj-')) {
    return {
      detectedPlatform: 'OpenAI',
      detectedKeyType: 'API_KEY',
      isValidFormat: trimmedKey.length > 20,
      officialLink: 'https://platform.openai.com/api-keys',
      matchedPrefix: 'sk-proj-'
    };
  }
  
  if (trimmedKey.startsWith('sk-ant-')) {
    return {
      detectedPlatform: 'Anthropic',
      detectedKeyType: 'API_KEY',
      isValidFormat: trimmedKey.length > 20,
      officialLink: 'https://console.anthropic.com/settings/keys',
      matchedPrefix: 'sk-ant-'
    };
  }

  if (trimmedKey.startsWith('AIzaSy')) {
    return {
      detectedPlatform: 'Google',
      detectedKeyType: 'API_KEY',
      isValidFormat: trimmedKey.length >= 25,
      officialLink: 'https://aistudio.google.com/app/apikey',
      matchedPrefix: 'AIzaSy'
    };
  }

  // Custom fallback
  return {
    detectedPlatform: 'Custom',
    detectedKeyType: 'API_KEY',
    isValidFormat: trimmedKey.length > 5,
    officialLink: '',
    matchedPrefix: ''
  };
}
