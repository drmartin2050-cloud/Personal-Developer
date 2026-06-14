export interface ExchangeRates {
  USD: number;
  EGP: number;
  EUR: number;
  CNY: number;
}

// Fallback rates in case network or API is offline
export const FALLBACK_RATES: ExchangeRates = {
  USD: 1.0,
  EGP: 47.65, // Stable realistic standard fallback
  EUR: 0.92,
  CNY: 7.25,
};

const CACHE_KEY = "portal_exchange_rates";
const CACHE_TIME_KEY = "portal_exchange_rates_timestamp";
const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetches current exchange rates from open.er-api.com.
 * Caches in LocalStorage to preserve rate limits.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const cachedRates = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const now = Date.now();

  if (cachedRates && cachedTime && now - parseInt(cachedTime, 10) < ONE_HOUR) {
    try {
      return JSON.parse(cachedRates);
    } catch (e) {
      console.warn("Error parsing cached exchange rates", e);
    }
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    
    if (data && data.rates) {
      const rates: ExchangeRates = {
        USD: 1.0,
        EGP: data.rates.EGP || FALLBACK_RATES.EGP,
        EUR: data.rates.EUR || FALLBACK_RATES.EUR,
        CNY: data.rates.CNY || FALLBACK_RATES.CNY,
      };

      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());

      return rates;
    }
  } catch (err) {
    console.error("Failed to fetch live exchange rates, falling back to static rates", err);
  }

  return FALLBACK_RATES;
}

/**
 * Convert USD value to all target currencies.
 */
export function convertCurrency(usdAmount: number, rates: ExchangeRates) {
  return {
    USD: usdAmount,
    EGP: usdAmount * rates.EGP,
    EUR: usdAmount * rates.EUR,
    CNY: usdAmount * rates.CNY,
  };
}

/**
 * Formats a currency amount nicely based on locale.
 */
export function formatCurrency(amount: number, currencyCode: keyof ExchangeRates, lang: "ar" | "en"): string {
  // Prevent scientific notation for tiny fractional amounts
  const fixedAmount = amount < 0.00001 ? amount.toFixed(7) : amount.toFixed(5);
  const parsed = parseFloat(fixedAmount);

  if (lang === "ar") {
    switch (currencyCode) {
      case "USD":
        return `$${parsed.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`;
      case "EGP":
        return `${parsed.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ج.م`;
      case "EUR":
        return `€${parsed.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`;
      case "CNY":
        return `¥${parsed.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 5 })} (يوان)`;
      default:
        return parsed.toString();
    }
  } else {
    switch (currencyCode) {
      case "USD":
        return `$${parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`;
      case "EGP":
        return `${parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} EGP`;
      case "EUR":
        return `€${parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`;
      case "CNY":
        return `¥${parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })} CNY`;
      default:
        return parsed.toString();
    }
  }
}
