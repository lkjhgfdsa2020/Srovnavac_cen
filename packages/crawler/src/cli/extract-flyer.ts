import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export async function extractFlyerProducts(url: string) {
  console.log(`[Flyer] Launching browser for: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  const products: { name: string, model_code: string, url: string }[] = [];

  page.on('response', async (res) => {
    try {
      const type = res.headers()['content-type'] || '';
      if (type.includes('json') || type.includes('text')) {
        const text = await res.text();
        
        // Lidl Leaflets usually load product hotspots in a JSON array. 
        // We look for objects containing 'clickoutUrl' or 'article' or typical product fields.
        if (text.includes('/p/')) {
          try {
            const data = JSON.parse(text);
            const findProducts = (obj: any) => {
              if (!obj) return;
              if (typeof obj === 'string' && obj.includes('/p/')) {
                const pUrl = obj.split('?')[0];
                if (pUrl.startsWith('http') || pUrl.startsWith('/p/')) {
                  const urlMatch = pUrl.match(/p(\\d+)/);
                  const model_code = urlMatch ? urlMatch[1] : `UNK-${Math.floor(Math.random()*10000)}`;
                  products.push({ name: 'Parkside Product', model_code, url: pUrl });
                }
              }
              if (typeof obj === 'object') {
                Object.values(obj).forEach(findProducts);
              }
            };
            findProducts(data);
          } catch (e) {
            // Not JSON or parse error, ignore
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Dismiss cookie banner
  try {
    await page.click('button:has-text("SOUHLASÍM")', { timeout: 3000 });
  } catch (e) {}

  // Wait for hotspots and JSON payloads to be fetched
  await page.waitForTimeout(5000);

  // Fallback: Check DOM for links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href.includes('/p/'));
  });

  for (const link of links) {
    const cleanUrl = link.split('?')[0];
    const urlMatch = cleanUrl.match(/p(\\d+)/);
    const model_code = urlMatch ? urlMatch[1] : `UNK-${Math.floor(Math.random()*10000)}`;
    products.push({ name: 'Parkside Product (Extracted)', model_code, url: cleanUrl });
  }

  await browser.close();

  // Deduplicate products
  const uniqueProducts = Array.from(new Map(products.map(p => [p.model_code, p])).values());
  return uniqueProducts;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: tsx extract-flyer.ts <url>');
    process.exit(1);
  }

  const products = await extractFlyerProducts(url);
  console.log(`Extracted ${products.length} products.`);
  
  if (products.length > 0) {
    const rootDir = path.resolve(process.cwd(), '../../');
    const seedPath = path.join(rootDir, 'config/products.seed.yml');
    const seedData = yaml.parse(fs.readFileSync(seedPath, 'utf8'));
    
    let addedCount = 0;
    for (const p of products) {
      if (!seedData.products.some((existing: any) => existing.model_code === p.model_code)) {
        seedData.products.push({
          model_code: p.model_code,
          name_cs: p.name
        });
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      fs.writeFileSync(seedPath, yaml.stringify(seedData));
      console.log(`Added ${addedCount} new products to products.seed.yml.`);
    } else {
      console.log('All extracted products were already in products.seed.yml.');
    }
  }
}

main().catch(console.error);
