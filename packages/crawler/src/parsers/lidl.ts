import * as cheerio from 'cheerio';
import { RawOffer } from 'core';
import { ParserDiagnostics } from '../diagnostics.js';

export interface ConnectorContext {
  source: string;
  country: string;
  currency: string;
}

export class LidlParser {
  static parseApiDetail(json: any, url: string, context: ConnectorContext): RawOffer[] {
    const scraped_at = new Date().toISOString();
    if (!json || json.length === 0) return [];
    
    const product = json[0];
    
    let availability: RawOffer['availability'] = 'unknown';
    if (product.stockAvailability?.onlineAvailable) {
      availability = 'online_available';
    } else if (product.stockAvailability?.availabilityIndicator === 2) {
      availability = 'out_of_stock';
    } else {
      availability = 'out_of_stock';
    }

    const price = product.price?.price !== undefined ? parseFloat(product.price.price) : null;
    const old_price = product.price?.oldPrice !== undefined ? parseFloat(product.price.oldPrice) : undefined;
    
    return [{
      source: context.source,
      country: context.country,
      url: product.canonicalUrl ? `https://www.lidl.cz${product.canonicalUrl}` : url,
      scraped_at,
      price,
      // @ts-ignore - we might want to extend RawOffer to support original_price later, for now we just keep price
      original_price: old_price, 
      currency: product.price?.currencyCode || context.currency,
      availability,
      raw_title: product.fullTitle || product.title || 'Unknown Title',
      raw_model_code: product.erpNumber || undefined,
      image_url: product.image || undefined,
    }];
  }

  static parseDetail(html: string, url: string, context: ConnectorContext): RawOffer[] {
    const $ = cheerio.load(html);
    const scraped_at = new Date().toISOString();
    
    // Fallback meta parsing
    const raw_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    const raw_model_code = $('.keyfeatures__modelcode').text().trim() || null;
    const priceStr = $('meta[property="product:price:amount"]').attr('content') || $('.pricebox__price').text().replace(/[^\d.,]/g, '').replace(',', '.');
    const price = priceStr ? parseFloat(priceStr) : null;
    const image_url = $('meta[property="og:image"]').attr('content') || undefined;
    
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
          image_url,
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
        image_url,
      });
    }

    return offers;
  }

  static parseSearch(html: string): { url: string; title: string }[] {
    const $ = cheerio.load(html);
    const results: { url: string; title: string }[] = [];
    
    // Lidl search results typically contain product tiles with links containing /p/
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      // Some titles might be nested inside text elements, or the text of the link itself
      let title = $(el).text().trim().replace(/\s+/g, ' ');
      if (!title) {
        // Try finding an img alt
        title = $(el).find('img').attr('alt') || '';
      }
      if (href && href.includes('/p/')) {
        results.push({ url: href, title });
      }
    });

    // Remove duplicates based on URL
    const uniqueResults = [];
    const seenUrls = new Set();
    for (const r of results) {
      // Clean up URL parameters
      const cleanUrl = r.url.split('?')[0];
      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        // Clean up titles by trying to find the most descriptive link for the URL
        const descriptiveTitle = results.filter(x => x.url.split('?')[0] === cleanUrl).map(x => x.title).sort((a, b) => b.length - a.length)[0] || '';
        uniqueResults.push({ url: cleanUrl, title: descriptiveTitle });
      }
    }

    return uniqueResults;
  }
}
