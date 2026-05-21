import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchWithRetry } from './http.js';
import { LidlParser } from './parsers/lidl.js';

export interface CatalogCandidate {
  url: string;
  source: string;
  country: string;
  variants: {
    raw_title: string;
    raw_model_code?: string;
    price: number | null;
  }[];
}

export class CatalogCrawler {
  private visitedUrls = new Set<string>();
  
  constructor(private maxPages = 5) {}

  async crawlCategory(baseUrl: string, source: string, country: string): Promise<CatalogCandidate[]> {
    const candidates: CatalogCandidate[] = [];
    let page = 1;
    let consecutiveEmptyPages = 0;

    while (page <= this.maxPages && consecutiveEmptyPages < 2) {
      console.log(`[${source}-${country}] Fetching category page ${page}...`);
      try {
        const url = `${baseUrl}?page=${page}`;
        const { data } = await fetchWithRetry(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          validateStatus: (status) => status < 500
        });

        const productLinks = data.match(/\/p\/[a-zA-Z0-9-]+\/p[0-9]+/g) || [];
        const uniqueLinks = [...new Set(productLinks)] as string[];

        let newLinksFound = 0;
        for (const link of uniqueLinks) {
          const fullUrl = `https://www.lidl.cz${link}`; // simplified for MVP
          if (!this.visitedUrls.has(fullUrl)) {
            this.visitedUrls.add(fullUrl);
            newLinksFound++;
            
            // In a real run, we would fetch each detail page. 
            // For now we will just register it to avoid hammering the server.
            candidates.push({
              url: fullUrl,
              source,
              country,
              variants: []
            });
          }
        }

        if (newLinksFound === 0) {
          consecutiveEmptyPages++;
        } else {
          consecutiveEmptyPages = 0;
        }

        page++;
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 500));
      } catch (err: any) {
        console.error(`Error on page ${page}:`, err.message);
        break;
      }
    }

    return candidates;
  }

  async populateDetails(candidates: CatalogCandidate[]) {
    // Only process a subset in dev mode to avoid ban
    const subset = candidates.slice(0, 3);
    for (const c of subset) {
      console.log(`Fetching detail for ${c.url}...`);
      try {
        const { data } = await fetchWithRetry(c.url, {
           headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        // Use existing Lidl parser
        const offers = LidlParser.parseDetail(data, c.url, { source: c.source, country: c.country, currency: 'CZK' });
        c.variants = offers.map(o => ({
          raw_title: o.raw_title,
          raw_model_code: o.raw_model_code,
          price: o.price
        }));
        
        await new Promise(r => setTimeout(r, 1000));
      } catch (e: any) {
         console.error(`Detail error for ${c.url}:`, e.message);
      }
    }
  }
}
