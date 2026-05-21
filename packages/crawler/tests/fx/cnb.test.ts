import { describe, it, expect } from 'vitest';
import { convertToCzk, FxData } from '../../src/fx/cnb';

const mockFxData: FxData = {
  source: 'CNB',
  date: '2026-05-11',
  fetched_at: '2026-05-11T12:00:00Z',
  fallback_used: false,
  rates: {
    CZK: { code: 'CZK', amount: 1, rate: 1 },
    EUR: { code: 'EUR', amount: 1, rate: 25.0 },
    PLN: { code: 'PLN', amount: 1, rate: 6.0 },
    HUF: { code: 'HUF', amount: 100, rate: 6.5 },
  },
};

describe('FX Conversion', () => {
  it('converts EUR to CZK', () => {
    expect(convertToCzk(10, 'EUR', mockFxData)).toBe(250.0);
  });

  it('converts PLN to CZK', () => {
    expect(convertToCzk(100, 'PLN', mockFxData)).toBe(600.0);
  });

  it('converts HUF to CZK using amount multiplier', () => {
    // 1000 HUF = (1000 / 100) * 6.5 = 10 * 6.5 = 65.0 CZK
    expect(convertToCzk(1000, 'HUF', mockFxData)).toBe(65.0);
  });

  it('handles CZK to CZK', () => {
    expect(convertToCzk(150, 'CZK', mockFxData)).toBe(150);
  });

  it('throws for unknown currency', () => {
    expect(() => convertToCzk(100, 'USD', mockFxData)).toThrow(/Exchange rate for USD not found/);
  });
});
