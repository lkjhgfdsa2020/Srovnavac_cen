# 07 – Zadání pro AI agenta a implementační backlog

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Instrukce pro AI agenta

Tento projekt implementuj iterativně. Nezačínej fází 2 nebo 3, dokud nejsou splněna acceptance criteria fáze 1.

Prioritní pravidla:

1. Cena pro porovnání je pouze cena produktu bez dopravy.
2. Hlavní měna webu je CZK.
3. Kurzy se berou z ČNB.
4. Lidl nabídka je eligible jen pokud je online dostupná k nákupu/předobjednávce.
5. Kaufland nabídka je eligible jen pokud je prodejce direct allowlist Kaufland/Lidl.
6. Externí marketplace prodejci nejsou součást MVP porovnání.
7. Produkty se porovnávají jen jako stejná varianta.
8. Detailní stránka je povinný zdroj finální ceny a varianty.
9. Historie je 30 dní.
10. Nepoužívej agresivní scraping ani obcházení ochran.

## 2. Doporučený implementační styl

- Malé kroky, každý s testy.
- Nejprve schémata a datový model.
- Pak FX modul.
- Pak parser pro jeden Lidl detail.
- Pak matching.
- Pak comparison.
- Pak frontend.
- Pak GitHub Actions.
- Teprve poté rozšíření na další země a zdroje.

## 3. Epiky fáze 1

### EPIC-F1-001 – Repo bootstrap

Cíl: založit monorepo a základní tooling.

Tasks:

- [ ] Vytvořit pnpm workspace.
- [ ] Přidat TypeScript config.
- [ ] Přidat Vitest.
- [ ] Přidat Vite React frontend.
- [ ] Přidat základní složky `config`, `data`, `packages`, `tests`.
- [ ] Přidat lint/format podle jednoduchého standardu.
- [ ] Přidat `README.md` pro spuštění.

Acceptance:

- `pnpm install` funguje.
- `pnpm test` funguje.
- `pnpm build:web` vytvoří prázdný statický web.

### EPIC-F1-002 – Schémata a konfigurace

Cíl: definovat datový model a seed produkty.

Tasks:

- [ ] Implementovat Zod schemas pro `Country`, `Source`, `RawOffer`, `NormalizedOffer`, `CanonicalProduct`, `CanonicalVariant`, `ComparisonRow`.
- [ ] Přidat `config/countries.yml`.
- [ ] Přidat `config/sources.yml`.
- [ ] Přidat `config/products.seed.yml` se 6 produkty.
- [ ] Přidat loader konfigurace.
- [ ] Přidat schema validation CLI.

Acceptance:

- `pnpm validate:data` validuje config.
- Seed produkty obsahují model code a critical attributes.

### EPIC-F1-003 – CNB FX modul

Cíl: načíst a použít ČNB kurzy.

Tasks:

- [ ] Implementovat fetch JSON endpointu ČNB `/cnbapi/exrates/daily`.
- [ ] Implementovat fallback TXT parser.
- [ ] Ukládat `fx-rates.json`.
- [ ] Přepočítat EUR/PLN/HUF na CZK.
- [ ] Zohlednit `amount`, zejména HUF za 100 jednotek.
- [ ] Přidat fallback na poslední známý kurz.

Tests:

- [ ] EUR conversion.
- [ ] PLN conversion.
- [ ] HUF conversion with amount=100.
- [ ] Missing API fallback.
- [ ] Schema validation of FX output.

Acceptance:

- `pnpm fx:update` vytvoří `data/public/fx-rates.json`.
- Přepočet vrací očekávané hodnoty.

### EPIC-F1-004 – Lidl detail parser – jedna země

Cíl: implementovat první funkční Lidl connector na jedné zemi, ideálně CZ nebo DE.

Tasks:

- [ ] Implementovat `LidlConnector` rozhraní.
- [ ] Implementovat detail fetch.
- [ ] Implementovat detail parser.
- [ ] Implementovat extrakci ceny.
- [ ] Implementovat extrakci měny.
- [ ] Implementovat extrakci model code.
- [ ] Implementovat dostupnost a online purchase flag.
- [ ] Implementovat variant extraction.
- [ ] Přidat fixture pro single variant detail.
- [ ] Přidat fixture pro multi variant detail.

Acceptance:

- Parser vrátí `RawOffer[]`.
- Multi variant detail vytvoří více nabídek.
- `not_online_purchasable` není eligible.

### EPIC-F1-005 – Matcher a bundle classifier

Cíl: správně rozlišit stejné a odlišné varianty.

Tasks:

- [ ] Implementovat model code extractor.
- [ ] Implementovat bundle classifier.
- [ ] Implementovat capacity/pieces extraction.
- [ ] Implementovat match scoring.
- [ ] Implementovat hard fail pravidla.
- [ ] Implementovat manual overrides.
- [ ] Přidat testy pro 6 seed produktů.

Acceptance:

- `PAPP 2012 A1 2dílná 12 Ah` se nesloučí s 1 ks.
- `PAMT 20-Li A1 bez akumulátoru` se nesloučí s verzí s akumulátorem.
- `PDSSA 20-Li B2 Smart 4 Ah` se nesloučí s bare tool.

### EPIC-F1-006 – Comparison engine

Cíl: vytvořit srovnání a nejlepší cenu.

Tasks:

- [ ] Normalizovat raw offers.
- [ ] Přidat CZK conversion.
- [ ] Filtrovat eligible offers.
- [ ] Seskupit podle canonical varianty.
- [ ] Najít best offer.
- [ ] Spočítat delta CZK a procenta.
- [ ] Vytvořit `latest-comparison.json`.
- [ ] Vytvořit `latest-comparison.csv`.
- [ ] Přidat history append a prune 30 dní.

Acceptance:

- Nejlepší cena je vybrána jen z online eligible nabídek.
- Ceny bez online dostupnosti nejsou best.
- CSV export existuje.

### EPIC-F1-007 – Frontend MVP

Cíl: statický osobní dashboard.

Tasks:

- [ ] Načíst `latest-comparison.json`.
- [ ] Zobrazit hlavní tabulku.
- [ ] Zobrazit lokální cenu + CZK.
- [ ] Zvýraznit best price.
- [ ] Zobrazit statusy.
- [ ] Zobrazit run status.
- [ ] Zobrazit FX date.
- [ ] Přidat CSV link.
- [ ] Přidat detail produktu nebo rozbalovací řádek.

Acceptance:

- Web ukáže 6 seed produktů.
- Buňky mají cenu nebo stav.
- Best price je jasně viditelná.
- Web lze otevřít ze statického buildu.

### EPIC-F1-008 – GitHub Actions

Cíl: denní a ruční provoz.

Tasks:

- [ ] Přidat `test.yml`.
- [ ] Přidat `crawl-and-build.yml`.
- [ ] Přidat `workflow_dispatch`.
- [ ] Přidat schedule 1× denně.
- [ ] Přidat artifact upload.
- [ ] Přidat commit dat nebo artifact-only režim.
- [ ] Přidat Step Summary.

Acceptance:

- Workflow lze spustit ručně.
- Workflow vytvoří data a web artifact.
- Chyba jedné země nezpůsobí ztrátu všech výsledků.

## 4. Epiky fáze 2

### EPIC-F2-001 – Automatický Lidl katalog

- [ ] Procházet brand/category stránky.
- [ ] Zpracovat stránkování.
- [ ] Sbírat detail URL.
- [ ] Deduplicovat detail URL.
- [ ] Zpracovat všechny varianty.
- [ ] Generovat canonical candidates.
- [ ] Vytvořit katalogový report.

### EPIC-F2-002 – Product overrides

- [ ] Přidat `product-overrides.yml`.
- [ ] Sloučení canonical candidates.
- [ ] Rozdělení špatně sloučených variant.
- [ ] Alias management.
- [ ] Ignorování produktů.

### EPIC-F2-003 – Kaufland direct-only connector

- [ ] Implementovat source config pro Kaufland CZ/SK/PL/AT/DE.
- [ ] Implementovat seller parser.
- [ ] Implementovat direct seller allowlist.
- [ ] Externí prodejce vyloučit.
- [ ] Přidat fixtures direct seller / external seller.
- [ ] Přidat health report s excluded counts.

### EPIC-F2-004 – Frontend rozšíření

- [ ] Filtry podle zemí/zdrojů.
- [ ] Filtry podle category/battery/bundle.
- [ ] Detail produktu s historií 30 dní.
- [ ] Health dashboard.
- [ ] Zobrazení match confidence.

### EPIC-F2-005 – Robustnost

- [ ] Retry/backoff.
- [ ] Parser warning system.
- [ ] Stale data handling.
- [ ] Data size monitor.
- [ ] Schema validation v CI.

## 5. Epiky fáze 3

### EPIC-F3-001 – Public deployment

- [ ] Public dataset bez interních debug informací.
- [ ] GitHub Pages deployment nebo jiný static hosting.
- [ ] Disclaimer.
- [ ] Public SEO nastavení jen pokud žádoucí.

### EPIC-F3-002 – Srovnávače

- [ ] Heureka connector.
- [ ] Idealo connector.
- [ ] Geizhals connector.
- [ ] Allegro connector.
- [ ] Compliance review pro každý zdroj.

### EPIC-F3-003 – Lokální e-shopy

- [ ] Storage pro trusted sellers.
- [ ] Connector template pro e-shop.
- [ ] Seller/source quality ranking.
- [ ] Dedup podle EAN/modelu.

### EPIC-F3-004 – Storage adapter

- [ ] Navrhnout externí DB schema.
- [ ] Přidat storage adapter interface.
- [ ] Implementovat GitHub adapter jako současný default.
- [ ] Implementovat volitelný SQLite/Turso/Supabase adapter.

## 6. Suggested initial AI prompt

Tento prompt lze vložit AI agentovi spolu s dokumenty:

```text
Implementuj projekt Parkside Price Watch podle přiložených Markdown dokumentů. Nejdříve realizuj pouze fázi 1. Dodržuj rozhodnutí: hlavní měna CZK, kurzy ČNB, porovnání produktové ceny bez dopravy, Lidl online detail stránky, přesné variant-level párování, historie 30 dní, GitHub Actions denní + ruční běh. Kaufland je pro fázi 1 pouze volitelný spike, pro fázi 2 direct-only. Nepoužívej agresivní scraping ani obcházení ochran. Každou část implementuj s testy a fixtures. Po dokončení fáze 1 musí fungovat lokální crawl, comparison JSON/CSV, statický frontend a GitHub Actions artifact.
```

## 7. Definition of Done – celkově

Implementace je akceptovatelná, pokud:

- data jsou validovaná schématy;
- testy pokrývají parser, matcher, FX a comparison;
- web jasně ukazuje lokální cenu, CZK cenu a best price;
- neonline produkty nejsou zahrnuté jako best;
- špatné bundle varianty se neslučují;
- GitHub Actions běh je reprodukovatelný;
- dokumentace spuštění je součástí repozitáře;
- žádné citlivé údaje nejsou ve frontendu;
- crawling je konzervativní a bez obcházení ochran.
