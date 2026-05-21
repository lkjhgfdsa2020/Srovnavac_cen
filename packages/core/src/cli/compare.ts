import fs from 'fs';
import path from 'path';
import { ComparisonEngine, FxDataLike } from '../comparison.js';
import { loadConfig } from '../config.js';
import { RawOffer } from '../matcher.js';
import { OverrideEngine } from '../overrides.js';
import { GitHubStorageAdapter } from '../storage.js';

async function main() {
  const storage = new GitHubStorageAdapter();
  const rootDir = path.resolve(process.cwd(), '../../');
  const config = loadConfig(path.join(rootDir, 'config'));
  
  if (!config.products) {
    throw new Error('No products configured.');
  }

  // Apply overrides
  let activeProducts = config.products;
  if (config.overrides) {
    activeProducts = OverrideEngine.apply(activeProducts, config.overrides);
  }

  // Load FX
  const fxPath = path.join(rootDir, 'data/public/fx-rates.json');
  let fxData: FxDataLike = { rates: { CZK: { code: 'CZK', amount: 1, rate: 1 } } };
  if (fs.existsSync(fxPath)) {
    fxData = JSON.parse(fs.readFileSync(fxPath, 'utf8'));
  }

  // Load Offers
  const offersPath = path.join(rootDir, 'data/history/raw-offers.json');
  let offers = await storage.loadRawOffers(offersPath);

  // Stale data handling: remove offers older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const originalCount = offers.length;
  offers = offers.filter(o => {
    if (!o.scraped_at) return false;
    const scrapedDate = new Date(o.scraped_at);
    return scrapedDate >= thirtyDaysAgo;
  });
  
  if (offers.length < originalCount) {
    console.log(`Pruned ${originalCount - offers.length} stale offers.`);
    await storage.saveRawOffers(offers, offersPath);
  }

  const rows = ComparisonEngine.run(offers, activeProducts, fxData);

  let excluded_external_sellers_count = 0;
  offers.forEach(o => {
    if (o.is_external_seller) excluded_external_sellers_count++;
  });

  const comparisonData = {
    generated_at: new Date().toISOString(),
    reference_currency: 'CZK',
    price_basis: 'product_price_without_shipping',
    health_report: {
      excluded_external_sellers_count
    },
    fx: {
      source: 'CNB', // from fxData if structured
      date: new Date().toISOString().split('T')[0]
    },
    rows
  };

  const pubDir = path.join(rootDir, 'data/public');
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

  await storage.saveComparison(comparisonData, path.join(pubDir, 'latest-comparison.json'));

  // Public dataset without debug info
  const publicData = {
    ...comparisonData,
    rows: comparisonData.rows.map(r => {
      const publicRow = { ...r };
      delete (publicRow as any).row_quality_flags;
      publicRow.cells = publicRow.cells.map(c => {
        const publicCell = { ...c };
        delete (publicCell as any).quality_flags;
        return publicCell;
      });
      return publicRow;
    })
  };
  await storage.saveComparison(publicData, path.join(pubDir, 'public-comparison.json'));

  // Write CSV
  const csvHeader = 'canonical_variant_id,product_name,model_code,bundle,best_country,best_source,best_price_czk\n';
  const csvRows = rows.map(r => [
    r.canonical_variant_id,
    r.display_name,
    r.model_code,
    r.bundle_summary,
    r.best_country || '',
    r.best_source || '',
    r.best_price_czk || ''
  ].join(','));
  
  fs.writeFileSync(path.join(pubDir, 'latest-comparison.csv'), csvHeader + csvRows.join('\n'));
  
  // Data size monitor
  const statsJson = fs.statSync(path.join(pubDir, 'latest-comparison.json'));
  const statsPublicJson = fs.statSync(path.join(pubDir, 'public-comparison.json'));
  const statsCsv = fs.statSync(path.join(pubDir, 'latest-comparison.csv'));
  const statsOffers = fs.existsSync(offersPath) ? fs.statSync(offersPath).size : 0;
  
  console.log('--- Data Size Monitor ---');
  console.log(`latest-comparison.json: ${(statsJson.size / 1024).toFixed(2)} KB`);
  console.log(`public-comparison.json: ${(statsPublicJson.size / 1024).toFixed(2)} KB`);
  console.log(`latest-comparison.csv: ${(statsCsv.size / 1024).toFixed(2)} KB`);
  console.log(`raw-offers.json: ${(statsOffers / 1024).toFixed(2)} KB`);
  console.log('-------------------------');

  console.log('Comparison completed.');
}

main();
