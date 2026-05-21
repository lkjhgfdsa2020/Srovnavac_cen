import { validateConfig } from '../config';
import path from 'path';

const configDir = path.resolve(process.cwd(), '../../config');
console.log(`Validating config in ${configDir}...`);

const result = validateConfig(configDir);

if (!result.success) {
  console.error('Validation failed:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
} else {
  console.log('Validation successful!');
  console.log(`Loaded ${result.data.countries?.length || 0} countries.`);
  console.log(`Loaded ${result.data.sources?.length || 0} sources.`);
  console.log(`Loaded ${result.data.products?.length || 0} products.`);
}
