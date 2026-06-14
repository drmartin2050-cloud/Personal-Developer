import { getEncoding } from "js-tiktoken";

let encoder: any = null;

try {
  // Initialize cl100k_base encoder (used by GPT-4, GPT-3.5, GPT-4o)
  encoder = getEncoding("cl100k_base");
} catch (e) {
  console.warn("js-tiktoken encoder initialization failed, falling back to heuristic model:", e);
}

/**
 * Counts the estimated number of tokens in a given text for English and Arabic.
 * Wraps tiktoken in a try/catch and falls back to a solid heuristic if needed.
 * 
 * Heuristic parameters:
 * - English text: ~4 characters per token
 * - Arabic text: Arabic unicode characters generate significantly more tokens in standard gpt tokenizers (around 1-2.5 tokens per word).
 */
export function countTokens(text: string): number {
  if (!text) return 0;

  if (encoder) {
    try {
      return encoder.encode(text).length;
    } catch (e) {
      console.error("Error during tokenization, using heuristic fallback:", e);
    }
  }

  // Fallback Heuristic
  const words = text.trim().split(/\s+/);
  let totalEstimated = 0;

  for (const word of words) {
    // Check if word contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(word);
    if (hasArabic) {
      // Arabic has lower token density per character (roughly 1.8 tokens per word)
      totalEstimated += Math.max(1, Math.ceil(word.length * 0.7));
    } else {
      // English standard heuristic (~1.3 tokens per word or ~4 chars per token)
      totalEstimated += Math.max(1, Math.ceil(word.length / 3.8));
    }
  }

  return totalEstimated;
}
