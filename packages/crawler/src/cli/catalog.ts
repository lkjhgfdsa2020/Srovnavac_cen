import fs from 'fs';
import path from 'path';
import { CatalogCrawler } from '../catalog.js';
import { ParserDiagnostics } from '../diagnostics.js';

async function main() {
  console.log('Starting Lidl Catalog Crawler...');
  const crawler = new CatalogCrawler(2); // limits to 2 pages for MVP/testing
  
  const baseUrl = 'https://www.lidl.cz/c/parkside/s10068914';
  const candidates = await crawler.crawlCategory(baseUrl, 'lidl', 'CZ');
  
  console.log(`Found ${candidates.length} unique candidates. Populating details for subset...`);
  await crawler.populateDetails(candidates);
  
  const reportPath = path.resolve(process.cwd(), '../../data/public/catalog-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(candidates, null, 2));
  
  const publicDir = path.resolve(process.cwd(), '../../data/public');
  ParserDiagnostics.saveReport(publicDir);

  console.log(`Catalog report saved to ${reportPath}`);
}

main();
