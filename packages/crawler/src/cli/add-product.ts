import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { LidlParser } from '../parsers/lidl.js';
import { KauflandParser } from '../parsers/kaufland.js';
import { fetchWithRetry } from '../http.js';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: tsx add-product.ts <url>');
    process.exit(1);
  }

  let source = '';
  let parser: any = null;

  if (url.includes('lidl.cz')) {
    source = 'lidl';
    parser = LidlParser;
  } else if (url.includes('kaufland.cz')) {
    source = 'kaufland';
    parser = KauflandParser;
  } else {
    console.error('Unsupported URL. Must be lidl.cz or kaufland.cz');
    process.exit(1);
  }

  console.log(`Fetching ${url}...`);
  const html = await fetchWithRetry(url);
  
  const offers = parser.parseDetail(html, url, { source, country: 'CZ', currency: 'CZK' });
  if (!offers || offers.length === 0) {
    console.error('Could not parse any offers from the provided URL.');
    process.exit(1);
  }

  const offer = offers[0];
  const modelCode = offer.raw_model_code || 'UNKNOWN';
  
  const newProduct = {
    canonical_product_id: `${source}-${modelCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    canonical_variant_id: `${source}-${modelCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-base`,
    name_cs: offer.raw_title,
    brand: 'Parkside',
    model_code: modelCode,
    product_type: 'tool',
    category: 'custom_added',
    battery_platform: 'unknown',
    bundle_type: 'base',
    critical_attributes: {}
  };

  const rootDir = path.resolve(process.cwd(), '../../');
  const seedPath = path.join(rootDir, 'config/products.seed.yml');
  const seedData = yaml.parse(fs.readFileSync(seedPath, 'utf8'));

  if (!seedData.products) seedData.products = [];

  // Check if already exists
  if (seedData.products.find((p: any) => p.model_code === modelCode)) {
    console.log('Product with this model code already exists in seed file.');
  } else {
    seedData.products.push(newProduct);
    fs.writeFileSync(seedPath, yaml.stringify(seedData));
    console.log(`Successfully added ${newProduct.name_cs} to products.seed.yml!`);

    // Append to raw-offers.json
    const rawOffersPath = path.join(rootDir, 'data/history/raw-offers.json');
    let rawOffers: any[] = [];
    if (fs.existsSync(rawOffersPath)) {
      rawOffers = JSON.parse(fs.readFileSync(rawOffersPath, 'utf8'));
    }
    rawOffers.push(offer);
    fs.writeFileSync(rawOffersPath, JSON.stringify(rawOffers, null, 2));
    console.log(`Appended the fetched CZ offer to raw-offers.json!`);
  }
}

main().catch(console.error);
