import axios from 'axios';
import { fetchWithRetry } from '../http.js';

export interface FxRate {
  code: string;
  amount: number;
  rate: number;
}

export interface FxData {
  source: string;
  date: string;
  fetched_at: string;
  fallback_used: boolean;
  rates: Record<string, FxRate>;
}

export async function fetchCnbFxRates(): Promise<FxData> {
  const dateStr = new Date().toISOString().split('T')[0];
  const fetchedAt = new Date().toISOString();

  let rates: Record<string, FxRate> = {
    CZK: { code: 'CZK', amount: 1, rate: 1 },
  };

  try {
    // Try JSON API first
    const response = await fetchWithRetry('https://api.cnb.cz/cnbapi/exrates/daily?lang=EN', { timeout: 10000 });
    const data = response.data;
    
    for (const item of data.rates) {
      rates[item.currencyCode] = {
        code: item.currencyCode,
        amount: item.amount,
        rate: item.rate,
      };
    }

    return {
      source: 'CNB',
      date: dateStr,
      fetched_at: fetchedAt,
      fallback_used: false,
      rates,
    };
  } catch (err) {
    console.warn('CNB JSON API failed, falling back to TXT endpoint.', err);
    try {
      // Fallback to TXT endpoint
      const response = await fetchWithRetry('https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt', { timeout: 10000 });
      const text = response.data as string;
      const lines = text.trim().split('\n');
      
      if (lines.length > 2) {
        for (let i = 2; i < lines.length; i++) {
          const parts = lines[i].split('|');
          if (parts.length === 5) {
            const code = parts[3];
            const amount = parseInt(parts[2], 10);
            const rate = parseFloat(parts[4]);
            if (!isNaN(amount) && !isNaN(rate)) {
              rates[code] = { code, amount, rate };
            }
          }
        }
      }

      return {
        source: 'CNB',
        date: dateStr,
        fetched_at: fetchedAt,
        fallback_used: true,
        rates,
      };
    } catch (fallbackErr) {
      console.error('CNB TXT fallback also failed.', fallbackErr);
      throw new Error('Failed to fetch FX rates from CNB.');
    }
  }
}

export function convertToCzk(amount: number, currency: string, fxData: FxData): number {
  if (currency === 'CZK') return amount;
  const rateInfo = fxData.rates[currency];
  if (!rateInfo) {
    throw new Error(`Exchange rate for ${currency} not found.`);
  }
  return (amount / rateInfo.amount) * rateInfo.rate;
}
