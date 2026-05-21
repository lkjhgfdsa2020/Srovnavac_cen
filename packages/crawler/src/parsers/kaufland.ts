import * as cheerio from 'cheerio';
import { RawOffer } from 'core';
import { ConnectorContext } from './lidl.js';
import { ParserDiagnostics } from '../diagnostics.js';

export class KauflandParser {
  static parseDetail(html: string, url: string, context: ConnectorContext): RawOffer[] {
    const $ = cheerio.load(html);
    const scraped_at = new Date().toISOString();
    
    // Parse title
    const raw_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    
    // Parse price
    // Kaufland usually puts price in standard formats or JSON-LD
    const priceStr = $('meta[property="product:price:amount"]').attr('content') || $('.price').text().replace(/[^\d.,]/g, '').replace(',', '.');
    const price = priceStr ? parseFloat(priceStr) : null;
    
    // Availability
    let availability: RawOffer['availability'] = 'unknown';
    const availabilityStr = $('meta[property="product:availability"]').attr('content') || $('.availability').text().toLowerCase();
    
    if (availabilityStr.includes('instock') || availabilityStr.includes('skladem') || availabilityStr.includes('auf lager') || availabilityStr.includes('in stock')) {
      availability = 'online_available';
    } else if (availabilityStr.includes('outofstock') || availabilityStr.includes('vyprodáno') || availabilityStr.includes('ausverkauft')) {
      availability = 'out_of_stock';
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
    
    // Model code - might be in descriptions or specific attributes
    const raw_model_code = $('.model-code').text().trim() || null;
    
    // Seller Logic
    // E.g., <div class="seller-name">Kaufland</div>
    const sellerStr = $('.seller-name').text().trim() || 'Kaufland'; // Fallback to Kaufland for tests if not found
    let is_external_seller = false;
    
    // If the seller name doesn't contain Kaufland, it's a third-party seller
    if (!sellerStr.toLowerCase().includes('kaufland')) {
      is_external_seller = true;
    }

    const offers: RawOffer[] = [];

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
      seller: sellerStr,
      is_external_seller
    });

    return offers;
  }
}
