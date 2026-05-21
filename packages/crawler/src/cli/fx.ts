import fs from 'fs';
import path from 'path';
import { fetchCnbFxRates } from '../fx/cnb.js';

async function main() {
  console.log('Fetching FX rates from CNB...');
  try {
    const fxData = await fetchCnbFxRates();
    console.log(`Fetched rates for ${Object.keys(fxData.rates).length} currencies.`);
    
    const outDir = path.resolve(process.cwd(), '../../data/public');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const outPath = path.join(outDir, 'fx-rates.json');
    fs.writeFileSync(outPath, JSON.stringify(fxData, null, 2), 'utf8');
    
    console.log(`FX rates saved to ${outPath}`);
    if (fxData.fallback_used) {
      console.log('NOTE: Fallback TXT endpoint was used.');
    }
  } catch (error) {
    console.error('Error fetching FX rates:', error);
    process.exit(1);
  }
}

main();
