import { z } from 'zod';

export const CountrySchema = z.object({
  code: z.string(),
  name_cs: z.string(),
  currency: z.string(),
  locale: z.string(),
  enabled: z.boolean(),
  notes: z.string().optional(),
});

export const SourceSchema = z.object({
  source: z.string(),
  country: z.string(),
  base_url: z.string(),
  parkside_url: z.string().optional(),
  phase_min: z.number(),
  currency: z.string(),
  supports_online_purchase: z.union([z.boolean(), z.literal('conditional')]),
  supports_detail_variants: z.boolean().optional(),
  enabled: z.boolean(),
  non_online_policy: z.string().optional(),
  seller_policy: z.string().optional(),
});

export const CanonicalProductSchema = z.object({
  canonical_product_id: z.string(),
  canonical_variant_id: z.string(),
  name_cs: z.string(),
  brand: z.string(),
  model_code: z.string(),
  product_type: z.string(),
  category: z.string(),
  battery_platform: z.string(),
  bundle_type: z.string(),
  critical_attributes: z.record(z.any()),
  aliases: z.array(z.string()).optional(),
  ean: z.string().optional(),
});

export const ProductOverrideSchema = z.object({
  id: z.string(),
  action: z.enum(['merge', 'split', 'ignore']),
  aliases: z.array(z.string()).optional(),
  reason: z.string().optional(),
  split_regex: z.string().optional()
});

export const TrustedSellerSchema = z.object({
  name: z.string(),
  country: z.string(),
  rating: z.number().min(0).max(5).optional(),
  trust_level: z.enum(['high', 'medium', 'low']),
  url: z.string().optional()
});

export const ConfigSchema = z.object({
  countries: z.array(CountrySchema).optional(),
  sources: z.array(SourceSchema).optional(),
  products: z.array(CanonicalProductSchema).optional(),
  overrides: z.array(ProductOverrideSchema).optional(),
  crawler: z.record(z.any()).optional(),
  trusted_sellers: z.array(TrustedSellerSchema).optional()
});

// For runtime scraped data
export const RawOfferSchema = z.object({
  source: z.string(),
  country: z.string(),
  url: z.string(),
  scraped_at: z.string(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  availability: z.enum(['online_available', 'online_preorder', 'out_of_stock', 'not_online_purchasable', 'unknown', 'source_error']),
  raw_title: z.string(),
  raw_model_code: z.string().optional(),
  raw_variant_text: z.string().optional(),
  ean: z.string().optional(),
  seller: z.string().optional(),
  is_external_seller: z.boolean().optional(),
  image_url: z.string().optional(),
});

export const NormalizedOfferSchema = RawOfferSchema.extend({
  offer_id: z.string(),
  price_czk: z.number().nullable(),
  eligible_for_best_price: z.boolean(),
  match_confidence: z.number().min(0).max(1),
  match_method: z.string(),
  canonical_product_id: z.string().optional(),
  canonical_variant_id: z.string().optional(),
  quality_flags: z.array(z.string()),
});

export const ComparisonCellSchema = z.object({
  country: z.string(),
  source: z.string(),
  offer_id: z.string(),
  status: z.string(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  price_czk: z.number().nullable(),
  delta_to_best_czk: z.number().nullable(),
  delta_to_best_percent: z.number().nullable(),
  is_best: z.boolean(),
  url: z.string(),
  scraped_at: z.string(),
  quality_flags: z.array(z.string()),
  seller: z.string().optional(),
  is_external_seller: z.boolean().optional(),
});

export const ComparisonRowSchema = z.object({
  canonical_variant_id: z.string(),
  canonical_product_id: z.string(),
  display_name: z.string(),
  model_code: z.string(),
  bundle_summary: z.string(),
  category: z.string(),
  image_url: z.string().optional().nullable(),
  best_offer_id: z.string().optional().nullable(),
  best_country: z.string().nullable(),
  best_source: z.string().nullable(),
  best_price_czk: z.number().nullable(),
  compared_at: z.string(),
  row_quality_flags: z.array(z.string()),
  cells: z.array(ComparisonCellSchema),
});
