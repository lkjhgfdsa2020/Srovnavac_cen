import * as cheerio from 'cheerio';
import { RawOffer } from 'core';
import { ParserDiagnostics } from '../diagnostics.js';

export interface ConnectorContext {
  source: string;
  country: string;
  currency: string;
}

export class LidlParser {
  static parseDetail(html: string, url: string, context: ConnectorContext): RawOffer[] {
    const $ = cheerio.load(html);
    const scraped_at = new Date().toISOString();
    
    // Fallback meta parsing
    const raw_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    const raw_model_code = $('.keyfeatures__modelcode').text().trim() || null;
    const priceStr = $('meta[property="product:price:amount"]').attr('content') || $('.pricebox__price').text().replace(/[^\d.,]/g, '').replace(',', '.');
    const price = priceStr ? parseFloat(priceStr) : null;
    
    const availabilityStr = $('meta[property="product:availability"]').attr('content') || $('.availabilitybox').text().toLowerCase();
    
    let availability: RawOffer['availability'] = 'unknown';
    if (availabilityStr.includes('instock') || availabilityStr.includes('skladem') || availabilityStr.includes('auf lager') || availabilityStr.includes('in stock')) {
      availability = 'online_available';
    } else if (availabilityStr.includes('outofstock') || availabilityStr.includes('vyprodáno') || availabilityStr.includes('ausverkauft')) {
      availability = 'out_of_stock';
    } else if (availabilityStr.includes('preorder')) {
      availability = 'online_preorder';
    } else if (availabilityStr.includes('not_online_purchasable')) {
      availability = 'not_online_purchasable';
    }

    if (raw_title === 'Unknown Title') {
      ParserDiagnostics.warn(context.source, url, 'Missing or unparseable title');
    }
    if (price === null) {
      ParserDiagnostics.warn(context.source, url, 'Missing or unparseable price');
    }
    if (availability === 'unknown') {
      ParserDiagnostics.warn(context.source, url, `Unknown availability string: ${availabilityStr}`);
    }

    // Single variant logic for MVP:
    // If the page has multiple variants, we'll try to find them.
    const variantElements = $('.variant-picker__option');
    const offers: RawOffer[] = [];

    if (variantElements.length > 0) {
      variantElements.each((_, el) => {
        const variantPriceStr = $(el).attr('data-price');
        const variantPrice = variantPriceStr ? parseFloat(variantPriceStr) : price;
        const variantText = $(el).text().trim();
        offers.push({
          source: context.source,
          country: context.country,
          url,
          scraped_at,
          price: variantPrice,
          currency: context.currency,
          availability,
          raw_title: `${raw_title} - ${variantText}`,
          raw_model_code: raw_model_code || undefined,
          raw_variant_text: variantText,
        });
      });
    } else {
      offers.push({
        source: context.source,
        country: context.country,
        url,
        scraped_at,
        price,
        currency: context.currency,
        availability,
        raw_title,
        raw_model_code: raw_model_code || undefined,
      });
    }

    return offers;
  }
}
