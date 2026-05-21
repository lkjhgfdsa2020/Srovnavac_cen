import { describe, it, expect } from 'vitest';
import { OverrideEngine, ProductOverride } from '../src/overrides';
import { CanonicalProduct } from '../src/matcher';

const sampleProducts: CanonicalProduct[] = [
  {
    canonical_product_id: 'p1',
    canonical_variant_id: 'p1-base',
    name_cs: 'Test Product 1',
    brand: 'TEST',
    model_code: 'T1',
    product_type: 'tool',
    category: 'cat1',
    battery_platform: 'NONE',
    bundle_type: 'base',
    critical_attributes: {}
  },
  {
    canonical_product_id: 'p2',
    canonical_variant_id: 'p2-base',
    name_cs: 'Test Product 2',
    brand: 'TEST',
    model_code: 'T2',
    product_type: 'tool',
    category: 'cat1',
    battery_platform: 'NONE',
    bundle_type: 'base',
    critical_attributes: {}
  }
];

describe('OverrideEngine', () => {
  it('ignores a product', () => {
    const overrides: ProductOverride[] = [{ id: 'p1', action: 'ignore' }];
    const result = OverrideEngine.apply(sampleProducts, overrides);
    expect(result.length).toBe(1);
    expect(result[0].canonical_product_id).toBe('p2');
  });

  it('merges aliases', () => {
    const overrides: ProductOverride[] = [{ id: 'p2', action: 'merge', aliases: ['Alias2'] }];
    const result = OverrideEngine.apply(sampleProducts, overrides);
    expect(result.find(p => p.canonical_product_id === 'p2')?.aliases).toContain('Alias2');
  });

  it('splits a variant', () => {
    const overrides: ProductOverride[] = [{ id: 'p1-base', action: 'split', split_regex: 'special' }];
    const result = OverrideEngine.apply(sampleProducts, overrides);
    expect(result.length).toBe(3);
    const split = result.find(p => p.canonical_variant_id === 'p1-base-split');
    expect(split).toBeDefined();
    expect(split?.critical_attributes.split_regex).toBe('special');
  });
});
