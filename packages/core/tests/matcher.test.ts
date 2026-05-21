import { describe, it, expect } from 'vitest';
import { Matcher, RawOffer, CanonicalProduct } from '../src/matcher';

const seedProducts: Record<string, CanonicalProduct> = {
  pump: {
    canonical_product_id: 'parkside-petps-1100-a1',
    canonical_variant_id: 'parkside-petps-1100-a1-base',
    name_cs: 'Ponorné kalové čerpadlo PETPS 1100 A1',
    brand: 'PARKSIDE',
    model_code: 'PETPS 1100 A1',
    product_type: 'ponorne_kalove_cerpadlo',
    category: 'zahrada_cerpadla',
    battery_platform: 'NONE',
    bundle_type: 'base',
    critical_attributes: {
      model_code: 'PETPS 1100 A1'
    },
    aliases: ['PETPS 1100 A1']
  },
  grinder: {
    canonical_product_id: 'parkside-pws-230-e5',
    canonical_variant_id: 'parkside-pws-230-e5-base',
    name_cs: 'Úhlová bruska PWS 230 E5',
    brand: 'PARKSIDE',
    model_code: 'PWS 230 E5',
    product_type: 'uhlova_bruska',
    category: 'elektricke_naradi',
    battery_platform: 'NONE',
    bundle_type: 'base',
    critical_attributes: {
      model_code: 'PWS 230 E5'
    },
    aliases: ['PWS 230 E5']
  },
  battery2pc: {
    canonical_product_id: 'parkside-papp-2012-a1',
    canonical_variant_id: 'parkside-papp-2012-a1-12ah-2pcs',
    name_cs: 'Sada Smart akumulátor 12 Ah PAPP 2012 A1, 2dílná',
    brand: 'PARKSIDE',
    model_code: 'PAPP 2012 A1',
    product_type: 'akumulator',
    category: 'baterie_nabijecky',
    battery_platform: 'X20V_SMART',
    bundle_type: 'battery_pack_multi',
    critical_attributes: {
      model_code: 'PAPP 2012 A1',
      capacity_ah: 12,
      smart: true,
      pack_count: 2
    },
    aliases: ['PAPP 2012 A1']
  },
  bareTool: {
    canonical_product_id: 'parkside-pamt-20-li-a1',
    canonical_variant_id: 'parkside-pamt-20-li-a1-no-battery',
    name_cs: 'Aku kombinovaná strunová sekačka 3 v 1 PAMT 20-Li A1 – bez akumulátoru a nabíječky',
    brand: 'PARKSIDE',
    model_code: 'PAMT 20-Li A1',
    product_type: 'aku_kombinovana_strunova_sekacka',
    category: 'zahradni_aku_naradi',
    battery_platform: 'X20V',
    bundle_type: 'bare_tool_no_battery_no_charger',
    critical_attributes: {
      model_code: 'PAMT 20-Li A1',
      includes_battery: false
    },
    aliases: ['PAMT 20-Li A1']
  }
};

describe('Matcher', () => {
  it('matches exact model code', () => {
    const offer: RawOffer = {
      source: 'lidl',
      country: 'CZ',
      url: '',
      scraped_at: '',
      price: 1000,
      currency: 'CZK',
      availability: 'online_available',
      raw_title: 'Úhlová bruska',
      raw_model_code: 'PWS 230 E5'
    };
    const result = Matcher.match(offer, seedProducts.grinder);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.method).toBe('match_model_code_exact');
  });

  it('fails if pieces count mismatch (ATS-003)', () => {
    const offer: RawOffer = {
      source: 'lidl',
      country: 'CZ',
      url: '',
      scraped_at: '',
      price: 1000,
      currency: 'CZK',
      availability: 'online_available',
      raw_title: 'Smart akumulátor 12 Ah PAPP 2012 A1, 1 ks',
      raw_model_code: 'PAPP 2012 A1'
    };
    const result = Matcher.match(offer, seedProducts.battery2pc);
    expect(result.confidence).toBe(0);
    expect(result.flags).toContain('pieces_mismatch');
  });

  it('fails if battery inclusion mismatch (ATS-004)', () => {
    const offer: RawOffer = {
      source: 'lidl',
      country: 'CZ',
      url: '',
      scraped_at: '',
      price: 1000,
      currency: 'CZK',
      availability: 'online_available',
      raw_title: 'Aku sekačka PAMT 20-Li A1 s 2Ah baterií',
      raw_model_code: 'PAMT 20-Li A1'
    };
    const result = Matcher.match(offer, seedProducts.bareTool);
    expect(result.confidence).toBe(0);
    expect(result.flags).toContain('bundle_mismatch_battery');
  });

  it('matches bare tool exactly', () => {
    const offer: RawOffer = {
      source: 'lidl',
      country: 'CZ',
      url: '',
      scraped_at: '',
      price: 1000,
      currency: 'CZK',
      availability: 'online_available',
      raw_title: 'Aku sekačka PAMT 20-Li A1 bez akumulátoru',
      raw_model_code: 'PAMT 20-Li A1'
    };
    const result = Matcher.match(offer, seedProducts.bareTool);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
