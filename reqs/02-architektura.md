# 02 – Architektura

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Doporučený technologický stack

Pro MVP se doporučuje TypeScript monorepo, protože crawler, validace, porovnávací engine i frontend mohou sdílet typy a schémata.

| Oblast | Doporučení | Poznámka |
|---|---|---|
| Runtime | Node.js 22 LTS | Stabilní v GitHub Actions. |
| Package manager | pnpm | Rychlá instalace, workspaces. |
| Crawling | Playwright + fetch/undici | Playwright pro dynamické stránky, fetch tam, kde stačí HTML/JSON. |
| HTML parsing | Cheerio | Pro statické HTML a fixture testy. |
| Validace | Zod | Sdílené schéma crawler/frontend. |
| Testy | Vitest | Unit + fixture parser testy. |
| Frontend | Vite + React + TypeScript | Statický build. |
| Tabulky | TanStack Table nebo vlastní jednoduchá tabulka | Podle složitosti filtrování. |
| Grafy | Recharts nebo jednoduchý SVG/HTML graf | Historie 30 dní. |
| Data | JSON/JSONL/CSV v repozitáři | Bez externí DB ve fázi 1/2. |
| CI/CD | GitHub Actions | Denní a ruční běh. |
| Hosting | Fáze 1/2 artifact/local; fáze 3 GitHub Pages | Pages je veřejné, proto pozor u osobní verze. |

Alternativně lze crawler implementovat v Pythonu, ale pro AI agenta je jednodušší držet jeden jazyk a sdílené schéma napříč aplikací.

## 2. Logická architektura

```text
GitHub Actions / lokální běh
        |
        v
+--------------------+
| Source connectors  |
| Lidl, Kaufland     |
+--------------------+
        |
        v
+--------------------+
| Raw offer storage  |
| parsed snapshots   |
+--------------------+
        |
        v
+--------------------+
| Normalizer         |
| prices, currency,  |
| availability       |
+--------------------+
        |
        v
+--------------------+
| Product matcher    |
| canonical product  |
| canonical variant  |
+--------------------+
        |
        v
+--------------------+
| FX service         |
| CNB -> CZK         |
+--------------------+
        |
        v
+--------------------+
| Comparison engine  |
| best price, flags  |
+--------------------+
        |
        v
+--------------------+
| Public data build  |
| JSON, CSV, status  |
+--------------------+
        |
        v
+--------------------+
| Static frontend    |
| table, detail, UX  |
+--------------------+
```

## 3. Modulární rozdělení

```text
parkside-price-watch/
  .github/
    workflows/
      crawl-and-build.yml
      test.yml

  config/
    countries.yml
    sources.yml
    products.seed.yml
    product-overrides.yml
    seller-allowlist.yml
    matching-rules.yml

  packages/
    core/
      src/
        schemas/
        money/
        dates/
        logger/
    crawler/
      src/
        connectors/
          lidl/
          kaufland/
        discovery/
        detail/
        runner/
    matcher/
      src/
        normalize-name.ts
        extract-model-code.ts
        bundle-classifier.ts
        match-engine.ts
    comparison/
      src/
        fx-cnb.ts
        compare.ts
        history.ts
        export-csv.ts
    web/
      src/
        components/
        pages/
        data/
        utils/
      public/
      vite.config.ts

  data/
    raw/
    normalized/
    history/
    public/

  tests/
    fixtures/
      lidl/
      kaufland/
    unit/
    integration/

  docs/
    parser-notes.md
    compliance.md
```

## 4. Datová pipeline

### 4.1 Krok 1: source discovery

Fáze 1:

- vstupem je `products.seed.yml`;
- pro každý seed produkt se generují dotazy podle `model_code`, aliasů a lokálních názvů;
- connector najde relevantní detail URL nebo použije ručně uložené URL, pokud je k dispozici.

Fáze 2:

- vstupem jsou brand/category stránky PARKSIDE;
- systém prochází stránkování a detailní URL;
- každý detail se zpracuje do variant-level nabídek.

### 4.2 Krok 2: detail fetch

Každý connector musí stáhnout detailní stránku produktu. Detail je povinný, protože:

- cena na listing kartě může být cena „od“;
- detail může obsahovat varianty;
- varianty mohou mít jiné SKU/modely/ceny;
- dostupnost může být variant-specific;
- doplňky mohou mít na jednom detailu více produktů.

### 4.3 Krok 3: detail parse

Parser vytvoří `RawOffer` nebo více `RawOffer` objektů.

Požadovaná pole:

- source;
- country;
- source URL;
- raw name;
- parsed model code;
- variant label;
- price;
- currency;
- availability;
- online purchase flag;
- source product ID;
- source variant ID, pokud existuje;
- seller, pokud existuje;
- scraped_at.

### 4.4 Krok 4: normalizace

Normalizer sjednotí:

- měny;
- desetinné oddělovače;
- dostupnost;
- texty typu „bez akumulátoru a nabíječky“;
- modelové kódy;
- variant labels;
- seller names.

### 4.5 Krok 5: matching

Matcher přiřadí nabídku ke canonical produktu a variantě.

Priority matchingu:

1. ruční override;
2. EAN/GTIN, pokud je dostupný;
3. model code exact + bundle exact;
4. source product relation / Lidl article number, pokud je cross-country stabilní;
5. model code + technické parametry;
6. název + parametry jako kandidát k ručnímu potvrzení.

### 4.6 Krok 6: FX přepočet

FX service:

- načte kurz ČNB pro datum běhu;
- uloží kurzy do `data/public/fx-rates.json`;
- přepočte EUR/PLN/HUF do CZK;
- respektuje pole `amount`, například HUF může být uváděný za 100 jednotek;
- při výpadku použije poslední známý kurz a nastaví quality flag.

Vzorec:

```text
price_czk = price_original * cnb_rate / cnb_amount
```

Příklady:

```text
EUR: amount=1, rate=24.335 => 99.99 EUR * 24.335 / 1
HUF: amount=100, rate=6.839 => 39990 HUF * 6.839 / 100
PLN: amount=1, rate=5.740 => 199 PLN * 5.740 / 1
```

### 4.7 Krok 7: comparison engine

Comparison engine seskupí nabídky podle `canonical_variant_id` a určí:

- nejlepší cenu;
- rozdíl oproti nejlepší ceně v CZK;
- rozdíl v procentech;
- počet dostupných zemí;
- počet chybějících/nezpůsobilých zemí;
- quality flags na řádku.

### 4.8 Krok 8: public data build

Výstupy:

```text
data/public/latest-comparison.json
data/public/latest-comparison.csv
data/public/catalog.json
data/public/run-status.json
data/public/fx-rates.json
data/public/health.json
data/history/price-history.jsonl
```

### 4.9 Krok 9: frontend build

Frontend načítá pouze `data/public/*`.

Ve fázi 1/2:

- build se ukládá jako GitHub Actions artifact;
- GitHub Pages je volitelné a nevhodné, pokud má být osobní použití skutečně neveřejné.

Ve fázi 3:

- build se publikuje přes GitHub Pages nebo jiný statický hosting.

## 5. Adapter pattern pro zdroje

Každý zdroj implementuje společné rozhraní:

```ts
export interface SourceConnector {
  source: SourceCode;
  country: CountryCode;
  discoverProducts(input: DiscoveryInput): Promise<DiscoveredProduct[]>;
  fetchProductDetail(product: DiscoveredProduct): Promise<FetchedDetail>;
  parseProductDetail(detail: FetchedDetail): Promise<RawOffer[]>;
}
```

### 5.1 Lidl connector

Odpovědnosti:

- najít produkt podle seed modelu nebo brand stránky;
- přejít na detail;
- vyparsovat varianty;
- určit online dostupnost;
- vyparsovat cenu a měnu;
- detekovat `add_to_cart` stav;
- vrátit variant-level nabídky.

### 5.2 Kaufland connector

Odpovědnosti:

- zpracovat jen země, kde Kaufland marketplace existuje;
- vyhledat detail nebo listing;
- vyparsovat prodejce;
- aplikovat direct-seller allowlist;
- externí marketplace nabídky vyloučit;
- vrátit jen nabídky, které splní direct-only pravidlo.

Kaufland nabídka bez spolehlivě zjištěného prodejce nesmí být zahrnuta do výsledného porovnání.

## 6. Storage strategy

### 6.1 Raw data

Doporučení pro fázi 1:

- neukládat každé stažené HTML dlouhodobě;
- ukládat parsované raw nabídky;
- HTML ukládat jen jako test fixtures pro důležité případy.

```text
data/raw/2026-05-11/lidl-cz.raw-offers.jsonl
data/raw/2026-05-11/lidl-de.raw-offers.jsonl
```

### 6.2 Normalized data

```text
data/normalized/2026-05-11/offers.normalized.jsonl
```

### 6.3 History

```text
data/history/price-history.jsonl
```

Každý řádek je jeden price snapshot.

### 6.4 Public data

Public data jsou optimalizovaná pro frontend. Nemají obsahovat zbytečné interní debug informace, cookies, HTML ani citlivé hodnoty.

## 7. Chybová odolnost

Crawler runner musí pracovat takto:

1. Každý source-country běží jako samostatná jednotka.
2. Chyba jedné země se zapíše do `run-status.json`.
3. Ostatní země pokračují.
4. Pokud je starší validní snapshot, lze ho zobrazit jako stale.
5. Pokud není žádný snapshot, buňka je `source_error` nebo `no_data`.

## 8. Quality flags

Doporučené flags:

| Flag | Význam |
|---|---|
| `match_manual_override` | Párování bylo ručně definováno. |
| `match_model_code_exact` | Přesná shoda modelu. |
| `variant_uncertain` | Varianta není jistá. |
| `bundle_mismatch` | Nabídka se nehodí do canonical varianty. |
| `not_online_purchasable` | Nelze koupit online. |
| `seller_not_allowed` | Kaufland prodejce není povolený. |
| `seller_unknown` | Prodejce se nepodařilo určit. |
| `fx_fallback_used` | Použit starší kurz. |
| `stale_offer` | Nabídka nebyla ověřená v posledním běhu. |
| `parser_warning` | Parser našel cenu, ale některá pole jsou nejistá. |
| `source_error` | Zdroj selhal. |

## 9. Bezpečnost a compliance

Systém nesmí:

- obcházet captcha;
- používat rotující proxy kvůli obcházení blokací;
- ignorovat robots.txt a podmínky zdrojů;
- provádět agresivní paralelní scraping;
- vystavovat interní raw HTML, cookies nebo hlavičky ve veřejném webu.

Systém musí:

- mít konfigurovatelný delay;
- mít user-agent identifikující osobní monitoring, pokud je vhodné;
- ukládat URL a timestamp každé ceny;
- jasně označit, že ceny jsou orientační a mohou se změnit.

## 10. Připravenost na externí databázi

Fáze 1/2 drží data v GitHubu. Architektura ale musí počítat s budoucím `StorageAdapter`:

```ts
export interface StorageAdapter {
  writeRawOffers(date: string, offers: RawOffer[]): Promise<void>;
  readLatestOffers(): Promise<NormalizedOffer[]>;
  appendPriceHistory(records: PriceHistoryRecord[]): Promise<void>;
  pruneHistory(days: number): Promise<void>;
}
```

Možné budoucí storage:

- GitHub repository files;
- GitHub Releases artifacts;
- SQLite/Turso;
- Supabase/Postgres;
- Cloudflare D1/R2;
- S3-compatible object storage.
