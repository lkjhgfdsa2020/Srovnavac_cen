# 08 – Příklady konfigurace a datových výstupů

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. `config/countries.yml`

```yaml
countries:
  - code: CZ
    name_cs: Česko
    currency: CZK
    locale: cs-CZ
    enabled: true

  - code: SK
    name_cs: Slovensko
    currency: EUR
    locale: sk-SK
    enabled: true

  - code: PL
    name_cs: Polsko
    currency: PLN
    locale: pl-PL
    enabled: true

  - code: HU
    name_cs: Maďarsko
    currency: HUF
    locale: hu-HU
    enabled: true
    notes: "V MVP jen online/předobjednávkové nabídky; standardní Lidl HU online nákup nemusí být dostupný."

  - code: AT
    name_cs: Rakousko
    currency: EUR
    locale: de-AT
    enabled: true

  - code: DE
    name_cs: Německo
    currency: EUR
    locale: de-DE
    enabled: true
```

## 2. `config/sources.yml`

```yaml
sources:
  - source: lidl
    country: CZ
    base_url: https://www.lidl.cz
    parkside_url: https://www.lidl.cz/c/parkside/s10068914
    phase_min: 1
    currency: CZK
    supports_online_purchase: true
    supports_detail_variants: true
    enabled: true

  - source: lidl
    country: SK
    base_url: https://www.lidl.sk
    parkside_url: https://www.lidl.sk/c/parkside/s10068914
    phase_min: 1
    currency: EUR
    supports_online_purchase: true
    supports_detail_variants: true
    enabled: true

  - source: lidl
    country: PL
    base_url: https://www.lidl.pl
    parkside_url: https://www.lidl.pl/c/parkside/s10068914
    phase_min: 1
    currency: PLN
    supports_online_purchase: true
    supports_detail_variants: true
    enabled: true

  - source: lidl
    country: HU
    base_url: https://www.lidl.hu
    parkside_url: https://www.lidl.hu/c/parkside/s10068914
    phase_min: 1
    currency: HUF
    supports_online_purchase: conditional
    supports_detail_variants: true
    enabled: true
    non_online_policy: mark_not_online_purchasable

  - source: lidl
    country: AT
    base_url: https://www.lidl.at
    parkside_url: https://www.lidl.at/c/parkside/s10068914
    phase_min: 1
    currency: EUR
    supports_online_purchase: true
    supports_detail_variants: true
    enabled: true

  - source: lidl
    country: DE
    base_url: https://www.lidl.de
    parkside_url: https://www.lidl.de/c/parkside/s10068914
    phase_min: 1
    currency: EUR
    supports_online_purchase: true
    supports_detail_variants: true
    enabled: true

  - source: kaufland
    country: CZ
    base_url: https://www.kaufland.cz
    phase_min: 2
    currency: CZK
    seller_policy: direct_only
    enabled: true

  - source: kaufland
    country: SK
    base_url: https://www.kaufland.sk
    phase_min: 2
    currency: EUR
    seller_policy: direct_only
    enabled: true

  - source: kaufland
    country: PL
    base_url: https://www.kaufland.pl
    phase_min: 2
    currency: PLN
    seller_policy: direct_only
    enabled: true

  - source: kaufland
    country: AT
    base_url: https://www.kaufland.at
    phase_min: 2
    currency: EUR
    seller_policy: direct_only
    enabled: true

  - source: kaufland
    country: DE
    base_url: https://www.kaufland.de
    phase_min: 2
    currency: EUR
    seller_policy: direct_only
    enabled: true
```

## 3. `config/products.seed.yml`

```yaml
products:
  - canonical_product_id: parkside-petps-1100-a1
    canonical_variant_id: parkside-petps-1100-a1-base
    name_cs: Ponorné kalové čerpadlo PETPS 1100 A1
    brand: PARKSIDE
    model_code: PETPS 1100 A1
    product_type: ponorne_kalove_cerpadlo
    category: zahrada_cerpadla
    battery_platform: NONE
    bundle_type: base
    critical_attributes:
      model_code: PETPS 1100 A1
    aliases:
      - PETPS 1100 A1
      - Ponorné kalové čerpadlo PETPS 1100 A1
      - Schmutzwasser-Tauchpumpe PETPS 1100 A1

  - canonical_product_id: parkside-pws-230-e5
    canonical_variant_id: parkside-pws-230-e5-base
    name_cs: Úhlová bruska PWS 230 E5
    brand: PARKSIDE
    model_code: PWS 230 E5
    product_type: uhlova_bruska
    category: elektricke_naradi
    battery_platform: NONE
    bundle_type: base
    critical_attributes:
      model_code: PWS 230 E5
      disc_diameter_mm: 230
    aliases:
      - PWS 230 E5
      - Úhlová bruska PWS 230 E5
      - Winkelschleifer PWS 230 E5
      - Szlifierka kątowa PWS 230 E5

  - canonical_product_id: parkside-papp-2012-a1
    canonical_variant_id: parkside-papp-2012-a1-12ah-2pcs
    name_cs: Sada Smart akumulátor 12 Ah PAPP 2012 A1, 2dílná
    brand: PARKSIDE
    model_code: PAPP 2012 A1
    product_type: akumulator
    category: baterie_nabijecky
    battery_platform: X20V_SMART
    bundle_type: battery_pack_multi
    critical_attributes:
      model_code: PAPP 2012 A1
      voltage_v: 20
      capacity_ah: 12
      smart: true
      pack_count: 2
      includes_charger: false
    aliases:
      - PAPP 2012 A1
      - Smart akumulátor 12 Ah
      - 2dílná sada
      - Smart Akku 12 Ah 2-teilig

  - canonical_product_id: parkside-pdssa-20-li-b2
    canonical_variant_id: parkside-pdssa-20-li-b2-smart-4ah
    name_cs: Aku rázový utahovák PDSSA 20-Li B2, Smart 4 Ah
    brand: PARKSIDE
    model_code: PDSSA 20-Li B2
    product_type: aku_razovy_utahovak
    category: aku_naradi
    battery_platform: X20V_SMART
    bundle_type: with_battery
    critical_attributes:
      model_code: PDSSA 20-Li B2
      voltage_v: 20
      included_battery_capacity_ah: 4
      smart_battery: true
    aliases:
      - PDSSA 20-Li B2
      - Smart 4 Ah
      - Akku-Drehschlagschrauber PDSSA 20-Li B2

  - canonical_product_id: parkside-ppbks-56-b2
    canonical_variant_id: parkside-ppbks-56-b2-electric-start
    name_cs: Benzínová řetězová pila s elektrickým startováním PPBKS 56 B2
    brand: PARKSIDE
    model_code: PPBKS 56 B2
    product_type: benzinova_retezova_pila
    category: zahradni_stroje
    battery_platform: NONE
    bundle_type: base
    critical_attributes:
      model_code: PPBKS 56 B2
      electric_start: true
    aliases:
      - PPBKS 56 B2
      - Benzínová řetězová pila s elektrickým startováním
      - Benzin-Kettensäge mit Elektrostart PPBKS 56 B2

  - canonical_product_id: parkside-pamt-20-li-a1
    canonical_variant_id: parkside-pamt-20-li-a1-no-battery
    name_cs: Aku kombinovaná strunová sekačka 3 v 1 PAMT 20-Li A1 – bez akumulátoru a nabíječky
    brand: PARKSIDE
    model_code: PAMT 20-Li A1
    product_type: aku_kombinovana_strunova_sekacka
    category: zahradni_aku_naradi
    battery_platform: X20V
    bundle_type: bare_tool_no_battery_no_charger
    critical_attributes:
      model_code: PAMT 20-Li A1
      voltage_v: 20
      functions_count: 3
      includes_battery: false
      includes_charger: false
    aliases:
      - PAMT 20-Li A1
      - bez akumulátoru a nabíječky
      - ohne Akku und Ladegerät
      - bez akumulatora i ładowarki
```

## 4. `config/seller-allowlist.yml`

```yaml
seller_allowlist:
  kaufland:
    CZ:
      - Kaufland
      - Kaufland Česká republika
      - Lidl
    SK:
      - Kaufland
      - Kaufland Slovenská republika
      - Lidl
    PL:
      - Kaufland
      - Kaufland Polska
      - Lidl
    AT:
      - Kaufland
      - Kaufland Österreich
      - Lidl
    DE:
      - Kaufland
      - Kaufland.de
      - Lidl
```

## 5. `config/crawler.yml`

```yaml
crawler:
  default_delay_ms: 1500
  max_concurrency_per_source: 1
  max_retries: 2
  retry_backoff_ms: 3000
  request_timeout_ms: 30000
  user_agent: "ParksidePriceWatch/0.1 personal price monitor"
  respect_robots_txt: true
  store_html_fixtures: false
  store_raw_offers_days: 30
```

## 6. `data/public/fx-rates.json`

```json
{
  "source": "CNB",
  "date": "2026-05-11",
  "fetched_at": "2026-05-11T14:45:00+02:00",
  "fallback_used": false,
  "rates": {
    "CZK": {
      "code": "CZK",
      "amount": 1,
      "rate": 1
    },
    "EUR": {
      "code": "EUR",
      "amount": 1,
      "rate": 24.335
    },
    "PLN": {
      "code": "PLN",
      "amount": 1,
      "rate": 5.74
    },
    "HUF": {
      "code": "HUF",
      "amount": 100,
      "rate": 6.839
    }
  }
}
```

## 7. `data/public/latest-comparison.json`

```json
{
  "generated_at": "2026-05-11T06:45:00Z",
  "reference_currency": "CZK",
  "price_basis": "product_price_without_shipping",
  "fx": {
    "source": "CNB",
    "date": "2026-05-11",
    "fallback_used": false
  },
  "rows": [
    {
      "canonical_variant_id": "parkside-pws-230-e5-base",
      "canonical_product_id": "parkside-pws-230-e5",
      "display_name": "Úhlová bruska PWS 230 E5",
      "model_code": "PWS 230 E5",
      "bundle_summary": "základní elektrické nářadí",
      "category": "elektricke_naradi",
      "best_offer_id": "lidl-de-pws-230-e5-2026-05-11",
      "best_country": "DE",
      "best_source": "lidl",
      "best_price_czk": 2190.0,
      "compared_at": "2026-05-11T06:45:00Z",
      "row_quality_flags": [],
      "cells": [
        {
          "country": "CZ",
          "source": "lidl",
          "offer_id": "lidl-cz-pws-230-e5-2026-05-11",
          "status": "available",
          "price": 2499,
          "currency": "CZK",
          "price_czk": 2499,
          "delta_to_best_czk": 309,
          "delta_to_best_percent": 14.11,
          "is_best": false,
          "url": "https://www.lidl.cz/...",
          "scraped_at": "2026-05-11T06:32:00Z",
          "quality_flags": ["match_model_code_exact"]
        },
        {
          "country": "DE",
          "source": "lidl",
          "offer_id": "lidl-de-pws-230-e5-2026-05-11",
          "status": "available",
          "price": 89.99,
          "currency": "EUR",
          "price_czk": 2190,
          "delta_to_best_czk": 0,
          "delta_to_best_percent": 0,
          "is_best": true,
          "url": "https://www.lidl.de/...",
          "scraped_at": "2026-05-11T06:35:00Z",
          "quality_flags": ["match_model_code_exact"]
        }
      ]
    }
  ]
}
```

## 8. `data/public/run-status.json`

```json
{
  "run_id": "2026-05-11T06:30:00Z",
  "phase": "phase1",
  "started_at": "2026-05-11T06:30:00Z",
  "finished_at": "2026-05-11T06:45:00Z",
  "status": "partial_success",
  "price_basis": "product_price_without_shipping",
  "history_days": 30,
  "fx": {
    "source": "CNB",
    "date": "2026-05-11",
    "fallback_used": false
  },
  "summary": {
    "seed_products": 6,
    "raw_offers": 24,
    "normalized_offers": 24,
    "eligible_offers": 16,
    "comparison_rows": 6,
    "best_prices_computed": 5
  },
  "sources": [
    {
      "source": "lidl",
      "country": "CZ",
      "status": "success",
      "discovered_count": 6,
      "fetched_count": 6,
      "parsed_offers_count": 6,
      "eligible_offers_count": 5,
      "errors": []
    },
    {
      "source": "lidl",
      "country": "HU",
      "status": "partial_success",
      "discovered_count": 4,
      "fetched_count": 4,
      "parsed_offers_count": 4,
      "eligible_offers_count": 0,
      "errors": [
        {
          "type": "not_online_purchasable",
          "message": "Lidl HU product pages do not expose standard online purchase for these products."
        }
      ]
    }
  ]
}
```

## 9. `data/history/price-history.jsonl`

```jsonl
{"date":"2026-05-11","scraped_at":"2026-05-11T06:32:00Z","canonical_variant_id":"parkside-pws-230-e5-base","offer_id":"lidl-cz-pws-230-e5-2026-05-11","source":"lidl","country":"CZ","price":2499,"currency":"CZK","price_czk":2499,"availability":"online_available","eligible_for_best_price":true,"url":"https://www.lidl.cz/...","quality_flags":["match_model_code_exact"]}
{"date":"2026-05-11","scraped_at":"2026-05-11T06:35:00Z","canonical_variant_id":"parkside-pws-230-e5-base","offer_id":"lidl-de-pws-230-e5-2026-05-11","source":"lidl","country":"DE","price":89.99,"currency":"EUR","price_czk":2190,"availability":"online_available","eligible_for_best_price":true,"url":"https://www.lidl.de/...","quality_flags":["match_model_code_exact"]}
```

## 10. CSV sloupce

Doporučený CSV export fáze 1:

```csv
canonical_variant_id,product_name,model_code,bundle,best_country,best_source,best_price_czk,cz_lidl_price,cz_lidl_price_czk,cz_lidl_status,cz_lidl_url,sk_lidl_price,sk_lidl_currency,sk_lidl_price_czk,sk_lidl_status,pl_lidl_price,pl_lidl_currency,pl_lidl_price_czk,pl_lidl_status,hu_lidl_price,hu_lidl_currency,hu_lidl_price_czk,hu_lidl_status,at_lidl_price,at_lidl_currency,at_lidl_price_czk,at_lidl_status,de_lidl_price,de_lidl_currency,de_lidl_price_czk,de_lidl_status,last_checked
parkside-pws-230-e5-base,Úhlová bruska PWS 230 E5,PWS 230 E5,base,DE,lidl,2190,2499,CZK,2499,online_available,https://www.lidl.cz/...,119.99,EUR,2920,online_available,499,PLN,2864,online_available,,,,not_online_purchasable,99.99,EUR,2433,online_available,89.99,EUR,2190,online_available,2026-05-11T06:45:00Z
```

## 11. Frontend config

```ts
export const appConfig = {
  referenceCurrency: 'CZK',
  priceBasis: 'Cena produktu bez dopravy',
  historyDays: 30,
  defaultFilters: {
    onlyOnlineAvailable: true,
    hideUncertainMatches: false,
    sources: ['lidl'],
    countries: ['CZ', 'SK', 'PL', 'HU', 'AT', 'DE']
  }
};
```
