import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { LidlParser } from './parsers/lidl.js';
import { BrowserPool } from './browser.js';
import { Matcher, CanonicalProduct, RawOffer } from 'core/src/matcher.js';

const DELAY_MS = 2000;

export class SearchSpider {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  private normalizeString(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  public async run() {
    const rootDir = path.resolve(process.cwd(), '../../');
    const seedPath = path.join(rootDir, 'config/products.seed.yml');
    const seedData = yaml.parse(fs.readFileSync(seedPath, 'utf8'));
    const products: CanonicalProduct[] = seedData.products;

    const countries = ['CZ', 'SK', 'PL', 'HU', 'AT', 'DE'];
    const discoveredOffers: RawOffer[] = [];

    const browserPool = new BrowserPool();
    await browserPool.init();

    console.log(`Starting spider for ${products.length} products across ${countries.length} countries...`);

    try {
      for (const product of products) {
      console.log(`\n🔍 Searching for ${product.model_code} (${product.name_cs})`);
      
      const normalizedModelCode = this.normalizeString(product.model_code);

      for (const country of countries) {
        const domain = `lidl.${country.toLowerCase()}`;
        const searchUrl = `https://www.${domain}/q/search?q=${encodeURIComponent(product.model_code)}`;
        
        console.log(`[${country}] Fetching search: ${searchUrl}`);
        await this.delay();

        let searchHtml = '';
        try {
          searchHtml = await browserPool.fetchHtml(searchUrl);
        } catch (e) {
          console.error(`[${country}] Search failed: ${e}`);
          continue;
        }

        const results = LidlParser.parseSearch(searchHtml);
        if (results.length === 0) {
          console.log(`[${country}] No results found.`);
          continue;
        }

        // Filter results: must contain model code in title or URL
        const validResults = results.filter(r => {
          const normTitle = this.normalizeString(r.title);
          const normUrl = this.normalizeString(r.url);
          return normTitle.includes(normalizedModelCode) || normUrl.includes(normalizedModelCode);
        });

        if (validResults.length === 0) {
          console.log(`[${country}] Found ${results.length} results, but none matched the model code '${product.model_code}'. Skipping.`);
          continue;
        }

        const bestResult = validResults[0]; // Take the first valid result
        let productUrl = bestResult.url;
        if (!productUrl.startsWith('http')) {
          productUrl = `https://www.${domain}${productUrl}`;
        }

        console.log(`[${country}] Selected result: ${bestResult.title} -> ${productUrl}`);
        
        console.log(`[${country}] Fetching detail page...`);
        await this.delay();

        let detailHtml = '';
        try {
          detailHtml = await browserPool.fetchHtml(productUrl);
        } catch (e) {
          console.error(`[${country}] Detail fetch failed: ${e}`);
          continue;
        }

        let currency = 'EUR';
        if (country === 'CZ') currency = 'CZK';
        if (country === 'PL') currency = 'PLN';
        if (country === 'HU') currency = 'HUF';

        const offers = LidlParser.parseDetail(detailHtml, productUrl, {
          source: 'lidl',
          country,
          currency
        });

        // Use Matcher to verify the parsed offer
        for (const offer of offers) {
          const matchResult = Matcher.match(offer, product);
          if (matchResult.confidence >= 0.5) {
            console.log(`[${country}] ✅ Verified offer: ${offer.price} ${offer.currency} (Confidence: ${matchResult.confidence})`);
            discoveredOffers.push(offer);
          } else {
            console.log(`[${country}] ❌ Rejected offer: ${offer.raw_title} (Confidence: ${matchResult.confidence})`);
          }
        }
        }
      }
    } finally {
      await browserPool.close();
    }

    console.log(`\nSpider finished. Found ${discoveredOffers.length} valid offers.`);

    // Load existing raw-offers, append, and save
    const rawOffersPath = path.join(rootDir, 'data/history/raw-offers.json');
    let rawOffers: RawOffer[] = [];
    if (fs.existsSync(rawOffersPath)) {
      rawOffers = JSON.parse(fs.readFileSync(rawOffersPath, 'utf8'));
    }
    
    // Deduplicate by URL
    const existingUrls = new Set(rawOffers.map(o => o.url));
    for (const offer of discoveredOffers) {
      if (!existingUrls.has(offer.url)) {
        rawOffers.push(offer);
        existingUrls.add(offer.url);
      }
    }

    fs.writeFileSync(rawOffersPath, JSON.stringify(rawOffers, null, 2));
    console.log(`Saved ${rawOffers.length} total offers to raw-offers.json`);
  }
}
