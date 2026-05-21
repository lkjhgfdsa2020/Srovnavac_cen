import * as cheerio from 'cheerio';
import { RawOffer } from 'core';
import { ConnectorContext } from './lidl.js';
import { ParserDiagnostics } from '../diagnostics.js';

export class GenericShopParser {
  static parseDetail(html: string, url: string, context: ConnectorContext): RawOffer[] {
    const $ = cheerio.load(html);
    const scraped_at = new Date().toISOString();
    
    // Look for JSON-LD Product schema
    let price: number | null = null;
    let currency: string | null = null;
    let availabilityStr: string = '';
    let raw_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';

    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}');
        const products = Array.isArray(data) ? data : [data];
        for (const item of products) {
          if (item['@type'] === 'Product') {
            if (item.name) raw_title = item.name;
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer.price) price = parseFloat(offer.price);
              if (offer.priceCurrency) currency = offer.priceCurrency;
              if (offer.availability) availabilityStr = offer.availability.toLowerCase();
            }
          }
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    });

    // Fallbacks if JSON-LD fails
    if (price === null) {
      const priceStr = $('meta[property="product:price:amount"]').attr('content') || $('.price, .product-price').first().text().replace(/[^\d.,]/g, '').replace(',', '.');
      price = priceStr ? parseFloat(priceStr) : null;
    }
    
    let availability: RawOffer['availability'] = 'unknown';
    if (availabilityStr.includes('instock') || availabilityStr.includes('skladem') || availabilityStr.includes('auf lager') || availabilityStr.includes('in stock')) {
      availability = 'online_available';
    } else if (availabilityStr.includes('outofstock') || availabilityStr.includes('vyprodáno') || availabilityStr.includes('ausverkauft')) {
      availability = 'out_of_stock';
    } else {
      // Very basic fallback
      const text = $('body').text().toLowerCase();
      if (text.includes('skladem') || text.includes('in stock')) {
        availability = 'online_available';
      }
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
      currency: currency || context.currency,
      availability,
      raw_title,
    }];
  }
}
