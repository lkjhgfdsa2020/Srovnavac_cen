import { RawOffer, CanonicalProduct, Matcher } from './matcher.js';
import { ComparisonRowSchema, ComparisonCellSchema, NormalizedOfferSchema } from './schemas.js';
import { z } from 'zod';

export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;
export type ComparisonCell = z.infer<typeof ComparisonCellSchema>;
export type NormalizedOffer = z.infer<typeof NormalizedOfferSchema>;

export interface FxDataLike {
  rates: Record<string, { code: string; amount: number; rate: number }>;
}

export class ComparisonEngine {
  static convertToCzk(amount: number, currency: string, fxData: FxDataLike): number {
    if (currency === 'CZK') return amount;
    const rateInfo = fxData.rates[currency];
    if (!rateInfo) {
      throw new Error(`Exchange rate for ${currency} not found.`);
    }
    return (amount / rateInfo.amount) * rateInfo.rate;
  }

  static run(offers: RawOffer[], products: CanonicalProduct[], fxData: FxDataLike): ComparisonRow[] {
    const rows: ComparisonRow[] = [];

    for (const product of products) {
      const matchedCells: ComparisonCell[] = [];
      let bestPriceCzk: number | null = null;
      let bestOfferId: string | null = null;
      let bestCountry: string | null = null;
      let bestSource: string | null = null;

      for (const offer of offers) {
        const matchResult = Matcher.match(offer, product);
        if (matchResult.confidence < 0.5) {
          continue; // No match
        }

        const offerId = `${offer.source}-${offer.country}-${offer.raw_model_code || 'unknown'}-${Math.random().toString(36).substring(7)}`;
        
        let priceCzk = null;
        if (offer.price !== null && offer.currency !== null) {
          try {
            priceCzk = Math.round(this.convertToCzk(offer.price, offer.currency, fxData) * 100) / 100;
          } catch (e) {
            console.warn(`Could not convert price for ${offer.currency}`);
          }
        }

        const eligible = offer.availability === 'online_available' && priceCzk !== null && !offer.is_external_seller;

        matchedCells.push({
          country: offer.country,
          source: offer.source,
          offer_id: offerId,
          status: offer.availability,
          price: offer.price,
          currency: offer.currency,
          price_czk: priceCzk,
          delta_to_best_czk: null,
          delta_to_best_percent: null,
          is_best: false,
          url: offer.url,
          scraped_at: offer.scraped_at,
          quality_flags: [matchResult.method, ...matchResult.flags, ...(offer.is_external_seller ? ['external_seller_excluded'] : [])],
          seller: offer.seller,
          is_external_seller: offer.is_external_seller
        });

        if (eligible) {
          if (bestPriceCzk === null || priceCzk! < bestPriceCzk) {
            bestPriceCzk = priceCzk;
            bestOfferId = offerId;
            bestCountry = offer.country;
            bestSource = offer.source;
          }
        }
      }

      // Compute deltas and is_best
      for (const cell of matchedCells) {
        if (cell.price_czk !== null && bestPriceCzk !== null) {
          cell.delta_to_best_czk = Math.round((cell.price_czk - bestPriceCzk) * 100) / 100;
          if (bestPriceCzk > 0) {
            cell.delta_to_best_percent = Math.round(((cell.price_czk - bestPriceCzk) / bestPriceCzk) * 10000) / 100;
          }
        }
        if (cell.offer_id === bestOfferId) {
          cell.is_best = true;
        }
      }

      let representativeImageUrl: string | null | undefined = null;
      for (const cell of matchedCells) {
        // Find corresponding raw offer to get image
        const raw = offers.find(o => 
          o.source === cell.source && 
          o.country === cell.country && 
          o.raw_model_code === product.model_code
        );
        // Fallback search since ID might not strictly equal model_code
        const rawOffer = offers.find(o => o.url === cell.url);
        if (rawOffer && rawOffer.image_url) {
          representativeImageUrl = rawOffer.image_url;
          break;
        }
      }

      const row: ComparisonRow = {
        canonical_variant_id: product.canonical_variant_id,
        canonical_product_id: product.canonical_product_id,
        display_name: product.name_cs,
        model_code: product.model_code,
        bundle_summary: product.bundle_type,
        category: product.category,
        image_url: representativeImageUrl,
        best_offer_id: bestOfferId,
        best_country: bestCountry,
        best_source: bestSource,
        best_price_czk: bestPriceCzk,
        compared_at: new Date().toISOString(),
        row_quality_flags: [],
        cells: matchedCells
      };

      rows.push(row);
    }

    return rows;
  }
}
