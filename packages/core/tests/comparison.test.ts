import { describe, it, expect } from 'vitest';
import { ComparisonEngine } from '../src/comparison';
import { RawOffer, CanonicalProduct } from '../src/matcher';

const mockFxData = {
  rates: {
    CZK: { code: 'CZK', amount: 1, rate: 1 },
    EUR: { code: 'EUR', amount: 1, rate: 25.0 }
  }
};

const product: CanonicalProduct = {
  canonical_product_id: 'parkside-pws-230-e5',
  canonical_variant_id: 'parkside-pws-230-e5-base',
  name_cs: 'Úhlová bruska PWS 230 E5',
  brand: 'PARKSIDE',
  model_code: 'PWS 230 E5',
  product_type: 'uhlova_bruska',
  category: 'elektricke_naradi',
  battery_platform: 'NONE',
  bundle_type: 'base',
  critical_attributes: { model_code: 'PWS 230 E5' }
};

describe('ComparisonEngine', () => {
  it('correctly compares two offers and finds the best price', () => {
    const offers: RawOffer[] = [
      {
        source: 'lidl',
        country: 'CZ',
        url: '',
        scraped_at: '',
        price: 2500,
        currency: 'CZK',
        availability: 'online_available',
        raw_title: 'Úhlová bruska PWS 230 E5',
        raw_model_code: 'PWS 230 E5'
      },
      {
        source: 'lidl',
        country: 'DE',
        url: '',
        scraped_at: '',
        price: 90, // 90 EUR = 2250 CZK
        currency: 'EUR',
        availability: 'online_available',
        raw_title: 'Winkelschleifer PWS 230 E5',
        raw_model_code: 'PWS 230 E5'
      }
    ];

    const rows = ComparisonEngine.run(offers, [product], mockFxData);
    expect(rows.length).toBe(1);
    
    const row = rows[0];
    expect(row.cells.length).toBe(2);
    expect(row.best_country).toBe('DE');
    expect(row.best_price_czk).toBe(2250);

    const czCell = row.cells.find(c => c.country === 'CZ')!;
    expect(czCell.delta_to_best_czk).toBe(250); // 2500 - 2250
    expect(czCell.is_best).toBe(false);

    const deCell = row.cells.find(c => c.country === 'DE')!;
    expect(deCell.is_best).toBe(true);
    expect(deCell.delta_to_best_czk).toBe(0);
  });
});
