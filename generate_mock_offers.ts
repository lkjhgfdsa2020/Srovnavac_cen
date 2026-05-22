import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
const seedPath = path.join(rootDir, 'config/products.seed.yml');
const seedData = yaml.parse(fs.readFileSync(seedPath, 'utf8'));

const offers: any[] = [];
const countries = ['CZ', 'SK', 'PL', 'HU', 'AT', 'DE'];
const sources = ['lidl', 'kaufland', 'heureka'];

const currencies: Record<string, string> = {
  'CZ': 'CZK',
  'SK': 'EUR',
  'PL': 'PLN',
  'HU': 'HUF',
  'AT': 'EUR',
  'DE': 'EUR'
};

for (const product of seedData.products) {
  for (const country of countries) {
    for (const source of sources) {
      // randomly skip some so it's not perfectly uniform
      if (Math.random() < 0.2) continue;

      const currency = currencies[country];
      let basePrice = 1000;
      if (currency === 'EUR') basePrice = 40;
      if (currency === 'PLN') basePrice = 180;
      if (currency === 'HUF') basePrice = 15000;
      
      const price = basePrice + (Math.random() * basePrice * 0.2); // + up to 20%

      let availability = 'online_available';
      if (Math.random() < 0.1) availability = 'out_of_stock';

      offers.push({
        source,
        country,
        url: source === 'lidl' ? `https://www.${source}.${country.toLowerCase()}/p/${product.canonical_product_id}/p100398589` : `https://www.${source}.${country.toLowerCase()}/p/${product.canonical_product_id}`,
        scraped_at: new Date().toISOString(),
        price: Math.round(price * 100) / 100,
        currency,
        availability,
        raw_title: product.name_cs,
        raw_model_code: product.model_code,
        image_url: 'https://www.lidl.cz/media/product/0/parkside-aku-vrtaci-sroubovak-pabsp-20-li-c3-bez-akumulatoru-a-nabijecky-zoom--3.jpg',
        is_external_seller: Math.random() < 0.05
      });
    }
  }
}

const historyDir = path.join(rootDir, 'data/history');
if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

fs.writeFileSync(path.join(historyDir, 'raw-offers.json'), JSON.stringify(offers, null, 2));
console.log(`Generated ${offers.length} mock offers.`);
