import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { ComparisonRowSchema } from '../schemas.js';

const OutputSchema = z.object({
  generated_at: z.string(),
  reference_currency: z.string(),
  price_basis: z.string(),
  health_report: z.record(z.any()).optional(),
  fx: z.object({
    source: z.string(),
    date: z.string()
  }),
  rows: z.array(ComparisonRowSchema)
});

function main() {
  const rootDir = path.resolve(process.cwd(), '../../');
  const outputPath = path.join(rootDir, 'data/public/latest-comparison.json');

  if (!fs.existsSync(outputPath)) {
    console.error(`Output file not found at ${outputPath}`);
    process.exit(1);
  }

  console.log(`Validating output at ${outputPath}...`);
  const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  const result = OutputSchema.safeParse(data);

  if (!result.success) {
    console.error('Validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  } else {
    console.log('Validation successful!');
    console.log(`Verified ${result.data.rows.length} rows.`);
  }
}

main();
