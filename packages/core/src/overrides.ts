import { CanonicalProduct } from './matcher';

export interface ProductOverride {
  id: string;
  action: 'merge' | 'split' | 'ignore';
  aliases?: string[];
  reason?: string;
  split_regex?: string;
}

export class OverrideEngine {
  static apply(products: CanonicalProduct[], overrides: ProductOverride[]): CanonicalProduct[] {
    let result = [...products];

    for (const override of overrides) {
      if (override.action === 'ignore') {
        result = result.filter(p => p.canonical_product_id !== override.id && p.canonical_variant_id !== override.id);
      }
      
      if (override.action === 'merge' && override.aliases) {
        result = result.map(p => {
          if (p.canonical_product_id === override.id || p.canonical_variant_id === override.id) {
            return {
              ...p,
              aliases: [...(p.aliases || []), ...override.aliases!]
            };
          }
          return p;
        });
      }

      if (override.action === 'split' && override.split_regex) {
        // We will duplicate the product and apply a bundle filter logic
        // This is a simplified split for MVP: we clone the product and set a new variant ID
        const target = result.find(p => p.canonical_variant_id === override.id);
        if (target) {
          const splitVariant: CanonicalProduct = {
            ...target,
            canonical_variant_id: `${target.canonical_variant_id}-split`,
            bundle_type: `${target.bundle_type}_split`,
            // Add a rule that raw_title must match the split_regex
            critical_attributes: {
              ...target.critical_attributes,
              split_regex: override.split_regex
            }
          };
          result.push(splitVariant);
        }
      }
    }

    return result;
  }
}
