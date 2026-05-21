import * as cheerio from 'cheerio';
import { RawOffer } from 'core';
import { ConnectorContext } from './lidl.js';
import { ParserDiagnostics } from '../diagnostics.js';

export class IdealoParser {
  static parseDetail(html: string, url: string, context: ConnectorContext): RawOffer[] {
    const $ = cheerio.load(html);
    const scraped_at = new Date().toISOString();
    
    const raw_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
    const priceStr = $('meta[itemprop="price"]').attr('content') || $('.price').text().replace(/[^\d.,]/g, '').replace(',', '.');
    const price = priceStr ? parseFloat(priceStr) : null;
    
    let availability: RawOffer['availability'] = 'online_available';

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
