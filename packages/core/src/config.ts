import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { ConfigSchema, CanonicalProductSchema, CountrySchema, SourceSchema } from './schemas';

export function loadConfig(configDir: string) {
  const readYaml = (filename: string) => {
    const fullPath = path.join(configDir, filename);
    if (!fs.existsSync(fullPath)) return undefined;
    const file = fs.readFileSync(fullPath, 'utf8');
    return yaml.parse(file);
  };

  const countries = readYaml('countries.yml')?.countries;
  const sources = readYaml('sources.yml')?.sources;
  const products = readYaml('products.seed.yml')?.products;
  const crawler = readYaml('crawler.yml')?.crawler;
  const overrides = readYaml('product-overrides.yml')?.overrides;
  const trusted_sellers = readYaml('trusted_sellers.yml')?.trusted_sellers;

  return {
    countries,
    sources,
    products,
    crawler,
    overrides,
    trusted_sellers
  };
}

export function validateConfig(configDir: string) {
  const data = loadConfig(configDir);
  const result = ConfigSchema.safeParse(data);
  return result;
}
