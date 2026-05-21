# 04 – Crawlery, zdroje a pravidla extrakce

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Zásady crawlerů

Crawler má být navržený jako konzervativní osobní monitoring, nikoli agresivní scraper.

Povinné zásady:

- crawl 1× denně + ruční spuštění;
- nízká paralelizace;
- konfigurovatelný delay mezi požadavky;
- žádné captcha bypassy;
- žádné proxy rotace za účelem obcházení omezení;
- respektovat robots.txt a podmínky zdrojových webů;
- zpracovávat chyby bez pádu celé pipeline;
- u každé ceny ukládat URL a timestamp.

## 2. Source-country konfigurace

```yaml
sources:
  - source: lidl
    country: CZ
    base_url: https://www.lidl.cz
    parkside_url: https://www.lidl.cz/c/parkside/s10068914
    currency: CZK
    phase: 1
    supports_online_purchase: true
    supports_detail_variants: true

  - source: lidl
    country: HU
    base_url: https://www.lidl.hu
    parkside_url: https://www.lidl.hu/c/parkside/s10068914
    currency: HUF
    phase: 1
    supports_online_purchase: conditional
    notes: "Lidl HU aktuálně nemá standardní online objednávky; zahrnout jen explicitní online/předobjednávkové produkty."

  - source: kaufland
    country: CZ
    base_url: https://www.kaufland.cz
    currency: CZK
    phase: 2
    seller_policy: direct_only
```

## 3. Lidl connector

### 3.1 Účel

Lidl connector má získávat online dostupné PARKSIDE produkty ze stránek Lidl v podporovaných zemích. Ve fázi 1 pracuje nad ručními seed produkty; ve fázi 2 automaticky objevuje katalog.

### 3.2 Fáze 1 flow

```text
products.seed.yml
   -> generate search queries
   -> search/listing page
   -> candidate detail URLs
   -> fetch detail page
   -> parse variants
   -> filter exact seed variant
   -> RawOffer[]
```

### 3.3 Fáze 2 flow

```text
PARKSIDE brand/category page
   -> pagination / product cards
   -> detail URLs
   -> fetch each detail
   -> parse all variants
   -> normalize
   -> auto catalog candidate generation
```

### 3.4 Detail page povinnost

Connector nesmí pro finální cenu spoléhat pouze na listing kartičku. Musí přejít na detail, protože:

- listing může zobrazovat cenu od;
- detail může mít více variant;
- doplňky a příslušenství často sdílí jednu detail stránku;
- dostupnost může být variant-specific;
- produktový kód/model může být až v detailních parametrech.

### 3.5 Variant extraction

Parser musí hledat variantové prvky, například:

- dropdown „Art“, „Typ“, „Varianta“, „Velikost“;
- radio buttons;
- swatche;
- samostatné variant cards;
- strukturovaný stav v HTML/JavaScriptu;
- JSON-LD / schema.org `Product` / `Offer`, pokud je dostupné.

Každá varianta musí mít samostatný `RawOffer`.

### 3.6 Online-purchase eligibility

Nabídka je online dostupná pouze pokud existuje silný signál:

- tlačítko přidat do košíku je aktivní;
- dostupnost říká „skladem“, „online“, „lieferbar“, „kup online“ apod.;
- existuje online preorder/Click&Pick flow, pokud je podporován.

Nabídka není online dostupná, pokud:

- stránka je jen brand/info page;
- produkt je jen v letáku nebo v prodejně;
- tlačítko košíku chybí nebo je disabled;
- dostupnost je vyprodaná;
- zdroj říká, že online nákup není možný.

### 3.7 Lokalizace dostupnosti

Doporučená mapovací tabulka:

| Raw text obsahuje | Normalized status |
|---|---|
| `Do košíku`, `Přidat do košíku`, `Kúpiť online` | `online_available` |
| `In den Warenkorb`, `Lieferung`, `Online kaufen` | `online_available` |
| `Dodaj do koszyka`, `Kup online` | `online_available` |
| `Elfogyott`, `Nincs készleten` | `out_of_stock` |
| `Vyprodáno`, `Vypredané`, `Ausverkauft`, `Wyprzedane` | `out_of_stock` |
| `Pouze v prodejně`, `Nur in der Filiale`, `tylko w sklepie` | `not_online_purchasable` |
| `Click&Pick`, `előrendelés` | `online_preorder` |

Poznámka: mapování musí být ověřené parser fixtures; texty se mohou měnit.

### 3.8 Product detail parser preference

Parser má používat zdroje v tomto pořadí:

1. strukturovaný JSON ve stránce;
2. JSON-LD `Product`/`Offer`;
3. stabilní data attributes;
4. viditelný HTML text;
5. fallback regex.

Parser nesmí být extrémně závislý na CSS třídách generovaných buildem, pokud existuje stabilnější možnost.

### 3.9 Phase 1 search strategy

Pro každý seed produkt používat tyto dotazy:

- přesný model code;
- model code bez mezer;
- český název;
- lokální alias, pokud existuje;
- produktový typ + model.

Příklad:

```yaml
queries:
  - "PWS 230 E5"
  - "PWS230E5"
  - "Úhlová bruska PWS 230 E5"
  - "Winkelschleifer PWS 230 E5"
  - "Szlifierka kątowa PWS 230 E5"
```

Pokud crawler najde více kandidátů:

- vybrat detail s přesným modelovým kódem;
- pokud jsou dva kandidáti se stejným modelem, zpracovat oba a nechat matcher rozhodnout variantu;
- pokud není jistota, nabídku označit `candidate_uncertain` a nezahrnout do best price.

## 4. Kaufland connector

### 4.1 Účel

Kaufland connector je od fáze 2 povinný, ale jen pro přímý prodej Kaufland/Lidl. Marketplace nabídky externích prodejců se nesmí zobrazit v hlavním porovnání.

### 4.2 Podporované země pro MVP

Kaufland Global Marketplace uvádí marketplace země jako AT, CZ, FR, DE, IT, PL, SK. Pro tento projekt jsou relevantní:

- CZ;
- SK;
- PL;
- AT;
- DE.

HU není pro Kaufland MVP podporované, pokud nebude existovat oficiální Kaufland marketplace s relevantním online prodejem.

### 4.3 Direct-seller allowlist

Konfigurace:

```yaml
kaufland_direct_sellers:
  CZ:
    - "Kaufland"
    - "Kaufland Česká republika"
    - "Lidl"
  SK:
    - "Kaufland"
    - "Kaufland Slovenská republika"
    - "Lidl"
  PL:
    - "Kaufland"
    - "Kaufland Polska"
    - "Lidl"
  AT:
    - "Kaufland"
    - "Kaufland Österreich"
    - "Lidl"
  DE:
    - "Kaufland"
    - "Kaufland.de"
    - "Lidl"
```

Tento allowlist je pracovní návrh. Skutečné názvy je nutné ověřit na reálných detailech.

### 4.4 Kaufland filtering rule

Pseudokód:

```ts
function isKauflandOfferEligible(offer: RawOffer, allowlist: string[]): boolean {
  const seller = normalizeSellerName(offer.seller_raw);
  if (!seller) return false;
  return allowlist.some(allowed => seller === normalizeSellerName(allowed));
}
```

Pokud seller není známý:

- nenabízet v porovnání;
- uložit quality flag `seller_unknown`;
- zapsat do health reportu.

Pokud seller je externí:

- nenabízet v porovnání;
- zapsat `seller_not_allowed`;
- volitelně zvýšit `excluded_external_sellers_count`.

### 4.5 Kaufland Seller API

Kaufland Seller API může být relevantní až po ověření, protože:

- jde o API pro marketplace sellery;
- vyžaduje autentizaci a podpis požadavků;
- nemusí být vhodné pro osobní cenový monitoring bez seller účtu.

Pro fázi 2 je proto primární cesta veřejný web, pokud to podmínky a technická proveditelnost dovolí. API je pouze fallback/spike, ne požadavek MVP.

## 5. CNB FX connector

### 5.1 Požadavky

FX connector musí:

- používat ČNB jako zdroj;
- načítat kurzy pro EUR, PLN, HUF;
- ukládat datum kurzu;
- respektovat pole `amount`;
- mít fallback na poslední známý kurz;
- ukládat `fx_fallback_used`, pokud fallback nastane.

### 5.2 Doporučený endpoint

Preferovaný JSON endpoint:

```text
https://api.cnb.cz/cnbapi/exrates/daily?date=YYYY-MM-DD&lang=CZ
```

Fallback TXT endpoint:

```text
https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt?date=DD.MM.RRRR
```

Bez parametru lze použít poslední dostupné kurzy.

### 5.3 Validace kurzů

- Musí být přítomné `EUR`, `PLN`, `HUF`.
- HUF typicky používá `amount=100`; přepočet musí dělit hodnotou `amount`.
- Kurz musí být uložen v `data/public/fx-rates.json`.
- Pokud kurz není pro aktuální den kvůli víkendu/svátku, lze použít poslední publikovaný kurz a zobrazit jeho datum.

## 6. Rate limiting a retry

Doporučená konfigurace:

```yaml
crawler:
  default_delay_ms: 1500
  max_concurrency_per_source: 1
  max_retries: 2
  retry_backoff_ms: 3000
  request_timeout_ms: 30000
```

Pro fázi 2 při větším katalogu lze concurrency opatrně zvýšit, ale jen po ověření, že zdroje nejsou přetěžované.

## 7. Error handling

Každý source-country běh má výsledek:

```ts
export interface SourceRunStatus {
  source: SourceCode;
  country: CountryCode;
  started_at: string;
  finished_at?: string;
  status: 'success' | 'partial_success' | 'failed' | 'skipped';
  discovered_count: number;
  fetched_count: number;
  parsed_offers_count: number;
  eligible_offers_count: number;
  excluded_offers_count: number;
  errors: RunError[];
}
```

Chyby:

- `network_error`;
- `timeout`;
- `parser_error`;
- `no_candidates_found`;
- `variant_mismatch`;
- `seller_unknown`;
- `seller_not_allowed`;
- `not_online_purchasable`;
- `robots_or_terms_blocked`.

## 8. Test fixtures

Každý parser musí mít fixtures:

```text
tests/fixtures/lidl/cz/product-detail-single-variant.html
tests/fixtures/lidl/de/product-detail-multi-variant.html
tests/fixtures/lidl/pl/product-out-of-stock.html
tests/fixtures/kaufland/cz/direct-seller.html
tests/fixtures/kaufland/cz/external-seller.html
```

Fixture testy musí ověřit:

- cenu;
- měnu;
- model code;
- variant label;
- dostupnost;
- online purchase flag;
- seller u Kauflandu;
- počet variant.

## 9. Phase 1 crawler acceptance checklist

- [ ] Umí načíst seed config.
- [ ] Umí najít detail podle model code nebo ručně zadané URL.
- [ ] Umí zpracovat detail do jedné nebo více variant.
- [ ] Umí vyfiltrovat přesnou seed variantu.
- [ ] Umí označit produkt jako nenalezený.
- [ ] Umí označit variant mismatch.
- [ ] Umí označit not online purchasable.
- [ ] Umí zapsat raw/normalized/public data.
- [ ] Má testy pro parser, matcher a FX.
