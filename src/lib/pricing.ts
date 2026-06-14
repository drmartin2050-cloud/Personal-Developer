export interface ModelPrice {
  name: string;
  provider: string;
  inputCostPerMillion: number; // Cost in USD per 1M tokens
  outputCostPerMillion: number; // Cost in USD per 1M tokens
}

export const PRICING_TABLE: Record<string, ModelPrice> = {
  "gpt-4o": {
    name: "GPT-4o",
    provider: "OpenAI",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
  },
  "gpt-4o-mini": {
    name: "GPT-4o-mini",
    provider: "OpenAI",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
  },
  "claude-3-5-sonnet": {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
  },
  "claude-3-haiku": {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 1.25,
  },
  "gemini-1-5-pro": {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5.00,
  },
  "gemini-1-5-flash": {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
  },
  "mistral-large": {
    name: "Mistral Large",
    provider: "Mistral",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
  },
  "mistral-small": {
    name: "Mistral Small",
    provider: "Mistral",
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.60,
  }
};

/**
 * Calculated cost in USD.
 */
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING_TABLE[modelId];
  if (!pricing) return 0;
  const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPerMillion;
  return inputCost + outputCost;
}
