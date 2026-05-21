import * as cheerio from 'cheerio';
import { RawOffer } from 'core';
import { ConnectorContext } from './lidl.js';
import { ParserDiagnostics } from '../diagnostics.js';

export class HeurekaParser {
  static parseDetail(html: string, url: string, context: ConnectorContext): RawOffer[] {
    const $ = cheerio.load(html);
    const scraped_at = new Date().toISOString();
    
    const raw_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    
    // Attempt to extract minimum price or specific offer price
    const priceStr = $('meta[itemprop="price"]').attr('content') || $('.price').text().replace(/[^\d.,]/g, '').replace(',', '.');
    const price = priceStr ? parseFloat(priceStr) : null;
    
    let availability: RawOffer['availability'] = 'unknown';
    // Heureka usually indicates if product is in stock
    const availabilityStr = $('.availability').text().toLowerCase() || '';
    if (availabilityStr.includes('skladem') || availabilityStr.includes('in stock') || availabilityStr.includes('skladom')) {
      availability = 'online_available';
    } else if (availabilityStr.includes('vyprodáno') || availabilityStr.includes('out of stock')) {
      availability = 'out_of_stock';
    } else {
      availability = 'online_available'; // Default for MVP test
    }

    if (raw_title === 'Unknown Title') {
      ParserDiagnostics.warn(context.source, url, 'Missing or unparseable title');
    }
    if (price === null) {
      ParserDiagnostics.warn(context.source, url, 'Missing or unparseable price');
    }

    return [{
      source: context.source,
      country: context.country,
      url,
      scraped_at,
      price,
      currency: context.currency,
      availability,
      raw_title,
    }];
  }
}
