import { CanonicalProductSchema, RawOfferSchema } from './schemas';
import { z } from 'zod';

export type RawOffer = z.infer<typeof RawOfferSchema>;
export type CanonicalProduct = z.infer<typeof CanonicalProductSchema>;

export interface MatchResult {
  confidence: number;
  method: string;
  flags: string[];
}

export class Matcher {
  static extractBundleFeatures(text: string) {
    const lower = text.toLowerCase();
    
    const isBareTool = /(bez|ohne|without)\s+(akumul|akku|batter|bater)/i.test(lower);
    const hasBattery = !isBareTool && /(s |mit |with |incl\.\s*).*(akumul|akku|batter|bater)/i.test(lower);
    const hasCharger = /(nabíječ|ladegerät|charger)/i.test(lower) && !/(bez|ohne|without)\s+(nabíječ|ladegerät|charger)/i.test(lower);
    const isSmart = /smart/i.test(lower);
    
    let pieces = 1;
    const piecesMatch = lower.match(/(\d+)\s*(ks|dílná|teilig|pcs)/i);
    if (piecesMatch) {
      pieces = parseInt(piecesMatch[1], 10);
    }

    let capacityAh = null;
    const ahMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*ah/i);
    if (ahMatch) {
      capacityAh = parseFloat(ahMatch[1].replace(',', '.'));
    }

    let voltageV = null;
    const vMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*v/i);
    if (vMatch) {
      voltageV = parseFloat(vMatch[1].replace(',', '.'));
    }

    return { isBareTool, hasBattery, hasCharger, pieces, capacityAh, voltageV, isSmart };
  }

  static match(offer: RawOffer, product: CanonicalProduct): MatchResult {
    let confidence = 0;
    const flags: string[] = [];

    // 1. Check Model Code
    let modelMatch = false;
    if (offer.raw_model_code && offer.raw_model_code.toLowerCase() === product.model_code.toLowerCase()) {
      modelMatch = true;
      confidence += 0.5;
    } else if (offer.raw_title.toLowerCase().includes(product.model_code.toLowerCase())) {
      modelMatch = true;
      confidence += 0.4;
    } else {
      for (const alias of (product.aliases || [])) {
        if (offer.raw_title.toLowerCase().includes(alias.toLowerCase())) {
          modelMatch = true;
          confidence += 0.3;
          break;
        }
      }
    }

    if (!modelMatch) {
      return { confidence: 0, method: 'none', flags: ['model_mismatch'] };
    }

    // 2. Check Bundle Features vs Critical Attributes
    const offerText = `${offer.raw_title} ${offer.raw_variant_text || ''}`;
    const features = this.extractBundleFeatures(offerText);
    const attrs = product.critical_attributes;
    
    // Check specific critical attributes from the product seed
    if (attrs.includes_battery === false && !features.isBareTool && features.hasBattery) {
      return { confidence: 0, method: 'hard_fail', flags: ['bundle_mismatch_battery'] };
    }
    if (attrs.includes_battery === true && features.isBareTool) {
      return { confidence: 0, method: 'hard_fail', flags: ['bundle_mismatch_bare'] };
    }
    
    if (attrs.pack_count && attrs.pack_count !== features.pieces) {
      if (features.pieces !== 1 || offerText.match(/\d+\s*(ks|dílná|teilig|pcs)/i)) { // only fail if explicitly different
         return { confidence: 0, method: 'hard_fail', flags: ['pieces_mismatch'] };
      }
    }

    if (attrs.capacity_ah && features.capacityAh && attrs.capacity_ah !== features.capacityAh) {
      return { confidence: 0, method: 'hard_fail', flags: ['capacity_mismatch'] };
    }
    
    if (attrs.smart && !features.isSmart && offerText.toLowerCase().includes('ah')) { 
      // sometimes smart is omitted, but if it's explicitly a battery we might need it. We'll add a flag.
      flags.push('potentially_not_smart');
    }

    confidence += 0.5;

    return {
      confidence: Math.min(1.0, confidence),
      method: confidence >= 0.9 ? 'match_model_code_exact' : 'match_model_plus_bundle',
      flags
    };
  }
}
