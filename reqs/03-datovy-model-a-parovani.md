# 03 – Datový model a párování produktů

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Zásady datového modelu

Datový model musí být variant-level, ne jen product-level. U PARKSIDE produktů je běžné, že stejná detailní stránka nebo podobný název obsahuje více variant, které nelze cenově přímo porovnat.

Příklad:

- `PAMT 20-Li A1 – bez akumulátoru a nabíječky` není totéž jako sada s baterií.
- `PAPP 2012 A1 12 Ah, 2dílná sada` není totéž jako jeden 12Ah akumulátor.
- Příslušenství na jednom detailu může mít několik typů, každý s jinou cenou.

Proto musí existovat rozdíl mezi:

- `CanonicalProduct`: obecný model/produkt;
- `CanonicalVariant`: konkrétní porovnatelná varianta;
- `Offer`: jedna aktuální nabídka v zemi/zdroji;
- `PriceSnapshot`: historický záznam ceny.

## 2. Entity

### 2.1 Country

```ts
export type CountryCode = 'CZ' | 'SK' | 'PL' | 'HU' | 'AT' | 'DE';
```

```json
{
  "code": "PL",
  "name": "Polsko",
  "currency": "PLN",
  "locale": "pl-PL",
  "enabled": true
}
```

### 2.2 Source

```ts
export type SourceCode = 'lidl' | 'kaufland' | 'heureka' | 'idealo' | 'geizhals' | 'allegro' | 'local_eshop';
```

```json
{
  "source": "lidl",
  "country": "DE",
  "base_url": "https://www.lidl.de",
  "parkside_url": "https://www.lidl.de/c/parkside/s10068914",
  "supports_online_purchase": true,
  "supports_variants": true,
  "phase": 1
}
```

### 2.3 CanonicalProduct

Canonical product je obecná produktová identita bez ohledu na zemi.

```ts
export interface CanonicalProduct {
  canonical_product_id: string;
  brand: 'PARKSIDE' | 'PARKSIDE PERFORMANCE' | 'UNKNOWN';
  product_line?: string;
  model_code: string;
  product_type: string;
  category: string;
  battery_platform?: 'X12V' | 'X20V' | 'X20V_SMART' | 'NONE' | 'UNKNOWN';
  name_cs: string;
  aliases: string[];
  created_at: string;
  updated_at: string;
}
```

Příklad:

```json
{
  "canonical_product_id": "parkside-pws-230-e5",
  "brand": "PARKSIDE",
  "model_code": "PWS 230 E5",
  "product_type": "uhlova_bruska",
  "category": "elektronaradi",
  "battery_platform": "NONE",
  "name_cs": "Úhlová bruska PWS 230 E5",
  "aliases": ["PWS 230 E5", "Winkelschleifer PWS 230 E5", "Szlifierka kątowa PWS 230 E5"],
  "created_at": "2026-05-11T00:00:00Z",
  "updated_at": "2026-05-11T00:00:00Z"
}
```

### 2.4 CanonicalVariant

Canonical variant je přesná jednotka porovnání.

```ts
export interface CanonicalVariant {
  canonical_variant_id: string;
  canonical_product_id: string;
  variant_key: string;
  bundle_type: BundleType;
  included_battery_capacity_ah?: number;
  included_battery_count?: number;
  includes_charger?: boolean;
  pack_count?: number;
  critical_attributes: Record<string, string | number | boolean>;
  compare_eligible: boolean;
  aliases: string[];
}
```

```ts
export type BundleType =
  | 'base'
  | 'bare_tool_no_battery_no_charger'
  | 'with_battery'
  | 'with_battery_and_charger'
  | 'battery_pack_single'
  | 'battery_pack_multi'
  | 'accessory_variant'
  | 'set_multi_piece'
  | 'unknown';
```

Příklad pro 2dílnou sadu baterií:

```json
{
  "canonical_variant_id": "parkside-papp-2012-a1-12ah-2pcs",
  "canonical_product_id": "parkside-papp-2012-a1",
  "variant_key": "12ah-smart-2pcs",
  "bundle_type": "battery_pack_multi",
  "included_battery_capacity_ah": 12,
  "included_battery_count": 2,
  "includes_charger": false,
  "pack_count": 2,
  "critical_attributes": {
    "smart": true,
    "voltage": 20,
    "capacity_ah": 12,
    "pieces": 2
  },
  "compare_eligible": true,
  "aliases": ["PAPP 2012 A1", "12 Ah", "2dílná", "2-teilig", "2 szt."]
}
```

### 2.5 RawOffer

RawOffer je výstup parseru před plnou normalizací.

```ts
export interface RawOffer {
  source: SourceCode;
  country: CountryCode;
  source_product_id?: string;
  source_variant_id?: string;
  url: string;
  name_raw: string;
  variant_label_raw?: string;
  model_code_raw?: string;
  price_raw: string;
  currency_raw?: string;
  availability_raw?: string;
  seller_raw?: string;
  online_purchase_raw?: boolean;
  scraped_at: string;
  parser_version: string;
  raw_debug?: Record<string, unknown>;
}
```

### 2.6 NormalizedOffer

```ts
export interface NormalizedOffer {
  offer_id: string;
  source: SourceCode;
  country: CountryCode;
  source_product_id?: string;
  source_variant_id?: string;
  url: string;

  name: string;
  brand: string;
  model_code?: string;
  variant_label?: string;

  price: number;
  currency: 'CZK' | 'EUR' | 'PLN' | 'HUF';
  price_czk?: number;
  fx_rate?: number;
  fx_amount?: number;
  fx_date?: string;
  fx_source?: 'CNB';

  availability: AvailabilityStatus;
  online_purchase: boolean;
  seller?: string;
  seller_type?: 'direct' | 'marketplace_external' | 'unknown';

  canonical_product_id?: string;
  canonical_variant_id?: string;
  match_confidence?: number;
  match_method?: MatchMethod;
  quality_flags: string[];

  scraped_at: string;
  eligible_for_best_price: boolean;
}
```

```ts
export type AvailabilityStatus =
  | 'online_available'
  | 'online_preorder'
  | 'out_of_stock'
  | 'not_online_purchasable'
  | 'unknown'
  | 'source_error';
```

### 2.7 PriceSnapshot

```ts
export interface PriceSnapshot {
  snapshot_id: string;
  date: string;
  scraped_at: string;
  canonical_variant_id: string;
  offer_id: string;
  source: SourceCode;
  country: CountryCode;
  price: number;
  currency: string;
  price_czk: number;
  availability: AvailabilityStatus;
  eligible_for_best_price: boolean;
  url: string;
  quality_flags: string[];
}
```

### 2.8 ComparisonRow

```ts
export interface ComparisonRow {
  canonical_variant_id: string;
  canonical_product_id: string;
  display_name: string;
  model_code: string;
  bundle_summary: string;
  category: string;
  best_offer_id?: string;
  best_country?: CountryCode;
  best_source?: SourceCode;
  best_price_czk?: number;
  compared_at: string;
  cells: ComparisonCell[];
  row_quality_flags: string[];
}
```

### 2.9 ComparisonCell

```ts
export interface ComparisonCell {
  country: CountryCode;
  source: SourceCode;
  offer_id?: string;
  status: 'available' | 'unavailable' | 'not_found' | 'not_supported' | 'source_error' | 'stale';
  price?: number;
  currency?: string;
  price_czk?: number;
  delta_to_best_czk?: number;
  delta_to_best_percent?: number;
  is_best?: boolean;
  url?: string;
  scraped_at?: string;
  quality_flags: string[];
}
```

## 3. Model code extraction

### 3.1 Cíl

Extrahovat modelové označení typu:

- `PETPS 1100 A1`
- `PWS 230 E5`
- `PAPP 2012 A1`
- `PDSSA 20-Li B2`
- `PPBKS 56 B2`
- `PAMT 20-Li A1`

### 3.2 Pravidla

Model code obvykle:

- začíná písmenem `P`;
- obsahuje 2–6 velkých písmen;
- může obsahovat číslo, napětí nebo `Li`;
- končí revizí typu `A1`, `B2`, `E5`.

Doporučené regexy:

```ts
const MODEL_PATTERNS = [
  /\bP[A-Z]{2,6}\s?\d{2,4}\s?(?:LI|Li|li)?\s?[A-Z]\d\b/g,
  /\bP[A-Z]{2,6}\s?\d{2}\s?-?\s?Li\s?[A-Z]\d\b/g,
  /\bPAPP\s?\d{4}\s?[A-Z]\d\b/g
];
```

Výstup normalizovat:

- vícenásobné mezery na jednu;
- `li` / `LI` na `Li`;
- zachovat pomlčku u `20-Li`, pokud je součást modelu.

## 4. Bundle classifier

### 4.1 Cíl

Rozpoznat, zda nabídka obsahuje baterii, nabíječku, počet kusů a důležité variantové parametry.

### 4.2 Klíčová slova podle jazyků

| Význam | CS/SK | DE | PL | HU |
|---|---|---|---|---|
| bez baterie | bez akumulátoru, bez akumulátora | ohne Akku | bez akumulatora | akkumulátor nélkül |
| bez nabíječky | bez nabíječky, bez nabíjačky | ohne Ladegerät | bez ładowarki | töltő nélkül |
| s baterií | s akumulátorem | mit Akku | z akumulatorem | akkumulátorral |
| s nabíječkou | s nabíječkou | mit Ladegerät | z ładowarką | töltővel |
| sada | sada, súprava | Set, Satz | zestaw, komplet | készlet |
| 2dílná | 2dílná, 2-dielna | 2-teilig | 2-częściowy, 2 szt. | 2 részes |
| Smart | Smart | Smart | Smart | Smart |

### 4.3 Výsledek classifieru

```ts
export interface BundleClassification {
  bundle_type: BundleType;
  includes_battery: boolean;
  includes_charger: boolean;
  battery_capacity_ah?: number;
  battery_count?: number;
  pack_count?: number;
  confidence: number;
  evidence: string[];
}
```

## 5. Matching engine

### 5.1 MatchMethod

```ts
export type MatchMethod =
  | 'manual_override'
  | 'ean_exact'
  | 'source_id_exact'
  | 'model_code_exact_bundle_exact'
  | 'model_code_exact_specs_match'
  | 'model_code_exact_variant_uncertain'
  | 'name_similarity_candidate'
  | 'unmatched';
```

### 5.2 Scoring

Doporučené skóre:

| Kritérium | Body |
|---|---:|
| Ruční override | 1.00 |
| EAN exact | 1.00 |
| Model code exact | +0.45 |
| Bundle exact | +0.30 |
| Kapacita/napětí/počet kusů exact | +0.15 |
| Název typově odpovídá | +0.05 |
| Značka odpovídá | +0.05 |
| Bundle mismatch | hard fail |
| Jiný model code | hard fail |
| Chybí online purchase | není eligible |

Prahy:

- `>= 0.90`: automaticky potvrzené párování;
- `0.75–0.89`: zobrazit jako pravděpodobné, ale s warningem;
- `< 0.75`: nezahrnovat do best price bez ručního override;
- hard fail: neporovnávat.

### 5.3 Hard fail pravidla

Matcher musí odmítnout párování, pokud:

- modelový kód je jiný;
- bundle je nekompatibilní;
- počet kusů je jiný;
- baterie má jinou kapacitu;
- produkt je z jiné produktové řady a není explicitně povolený;
- detailová varianta odpovídá jinému příslušenství.

## 6. Seed produkty fáze 1 – detailní pravidla

### 6.1 `parkside-petps-1100-a1`

```yaml
canonical_product_id: parkside-petps-1100-a1
canonical_variant_id: parkside-petps-1100-a1-base
name_cs: Ponorné kalové čerpadlo PETPS 1100 A1
model_code: PETPS 1100 A1
brand: PARKSIDE
product_type: ponorne_kalove_cerpadlo
category: zahrada_cerpadla
bundle_type: base
critical_attributes:
  model_code: PETPS 1100 A1
```

Pravidla:

- vyžadovat přesný model `PETPS 1100 A1`;
- neslučovat s jinými čerpadly `PTPS`, `PTK`, apod.;
- varianta pravděpodobně bez battery systému.

### 6.2 `parkside-pws-230-e5`

```yaml
canonical_product_id: parkside-pws-230-e5
canonical_variant_id: parkside-pws-230-e5-base
name_cs: Úhlová bruska PWS 230 E5
model_code: PWS 230 E5
brand: PARKSIDE
product_type: uhlova_bruska
category: elektricke_naradi
bundle_type: base
critical_attributes:
  model_code: PWS 230 E5
  disc_diameter_mm: 230
```

Pravidla:

- vyžadovat `PWS 230 E5`;
- neslučovat s aku bruskami ani jinými průměry kotouče.

### 6.3 `parkside-papp-2012-a1-12ah-2pcs`

```yaml
canonical_product_id: parkside-papp-2012-a1
canonical_variant_id: parkside-papp-2012-a1-12ah-2pcs
name_cs: Sada Smart akumulátor 12 Ah PAPP 2012 A1, 2dílná
model_code: PAPP 2012 A1
brand: PARKSIDE
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
```

Hard fail:

- 1 ks baterie;
- jiná kapacita než 12 Ah;
- není Smart;
- obsahuje nabíječku, pokud canonical varianta neobsahuje nabíječku.

### 6.4 `parkside-pdssa-20-li-b2-smart-4ah`

```yaml
canonical_product_id: parkside-pdssa-20-li-b2
canonical_variant_id: parkside-pdssa-20-li-b2-smart-4ah
name_cs: Aku rázový utahovák PDSSA 20-Li B2, Smart 4 Ah
model_code: PDSSA 20-Li B2
brand: PARKSIDE
product_type: aku_razovy_utahovak
category: aku_naradi
battery_platform: X20V_SMART
bundle_type: with_battery
critical_attributes:
  model_code: PDSSA 20-Li B2
  voltage_v: 20
  included_battery_capacity_ah: 4
  smart_battery: true
```

Hard fail:

- bare tool bez baterie;
- jiná kapacita baterie;
- jiný model `PDSSA`;
- pokud je součástí nabíječka a canonical varianta ji nemá, označit jako potenciálně jinou variantu.

### 6.5 `parkside-ppbks-56-b2-electric-start`

```yaml
canonical_product_id: parkside-ppbks-56-b2
canonical_variant_id: parkside-ppbks-56-b2-electric-start
name_cs: Benzínová řetězová pila s elektrickým startováním PPBKS 56 B2
model_code: PPBKS 56 B2
brand: PARKSIDE
product_type: benzinova_retezova_pila
category: zahradni_stroje
bundle_type: base
critical_attributes:
  model_code: PPBKS 56 B2
  electric_start: true
```

Hard fail:

- jiný model pily;
- varianta bez elektrického startování;
- elektrická/aku pila místo benzínové.

### 6.6 `parkside-pamt-20-li-a1-no-battery`

```yaml
canonical_product_id: parkside-pamt-20-li-a1
canonical_variant_id: parkside-pamt-20-li-a1-no-battery
name_cs: Aku kombinovaná strunová sekačka 3 v 1 PAMT 20-Li A1 – bez akumulátoru a nabíječky
model_code: PAMT 20-Li A1
brand: PARKSIDE
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
```

Hard fail:

- verze s baterií;
- verze s nabíječkou;
- jiný model;
- jiný počet funkcí, pokud je uveden.

## 7. Historical price records

Historie se drží 30 dní. Každý den může mít jeden nebo více snapshotů podle ručního spuštění.

Doporučení:

- ukládat všechny snapshoty v den, ale ve frontendu primárně zobrazit poslední snapshot dne;
- při pruning odstranit záznamy starší než 30 dní;
- historie má obsahovat jen eligible i non-eligible nabídky, ale graf nejlepší ceny pracuje s eligible.

## 8. Zaokrouhlování a formátování

### 8.1 Interní hodnoty

- `price`: number s původní měnou;
- `price_czk`: number na 2 desetinná místa;
- `price_czk_display`: formátovat až ve frontendu.

### 8.2 Frontend formát

- CZK: `2 999 Kč`;
- EUR: `99,99 €`;
- PLN: `499,00 zł`;
- HUF: `39 990 Ft`.

### 8.3 Best price tie

Pokud ceny po zaokrouhlení na celé Kč jsou stejné:

- označit více buněk jako best;
- zobrazit text `sdílená nejlepší cena`.

## 9. Validace dat

Každý public JSON musí projít schema validací:

- žádná nabídka bez `source`, `country`, `url`, `scraped_at`;
- eligible nabídka musí mít `price`, `currency`, `price_czk`, `availability=online_available|online_preorder`;
- Kaufland eligible nabídka musí mít `seller_type=direct`;
- nabídka s `match_confidence < 0.75` nesmí být eligible pro best price;
- každá comparison row musí mít `canonical_variant_id`.
