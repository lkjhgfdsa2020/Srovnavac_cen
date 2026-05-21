# 06 – GitHub provoz, Actions, data a deployment

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Provozní cíl

Projekt má ve fázi 1 a 2 běžet celý v GitHubu:

- zdrojový kód v repozitáři;
- konfigurace produktů a zdrojů v repozitáři;
- crawler spouštěný přes GitHub Actions;
- data ukládaná do repozitáře nebo artifacts;
- web build jako artifact;
- GitHub Pages až když je akceptovaná veřejnost webu.

## 2. GitHub Pages upozornění

GitHub Pages web je obecně veřejně dostupný. Pokud má fáze 1/2 zůstat osobní a neveřejná, doporučuje se nepoužívat GitHub Pages a místo toho:

1. držet privátní repozitář;
2. generovat statický web jako artifact;
3. stáhnout artifact a otevřít lokálně;
4. veřejný deployment zapnout až ve fázi 3.

## 3. Workflows

### 3.1 `test.yml`

Spouštění:

- na pull request;
- na push do hlavní větve.

Úkoly:

- instalace dependencies;
- TypeScript check;
- unit testy;
- fixture parser testy;
- schema validation;
- web build smoke test.

### 3.2 `crawl-and-build.yml`

Spouštění:

- denně 1×;
- ručně přes `workflow_dispatch`.

Úkoly:

1. checkout;
2. setup Node/pnpm;
3. instalace dependencies;
4. instalace Playwright browsers, pokud crawler používá Playwright;
5. spuštění crawleru;
6. načtení kurzů ČNB;
7. normalizace a matching;
8. build public data;
9. prune historie na 30 dní;
10. schema validation;
11. build webu;
12. upload artifactu;
13. volitelný commit dat zpět do repozitáře;
14. GitHub Step Summary.

## 4. Návrh workflow YAML

```yaml
name: Crawl and build

on:
  workflow_dispatch:
    inputs:
      phase:
        description: "Phase to run"
        required: false
        default: "phase1"
        type: choice
        options:
          - phase1
          - phase2
      sources:
        description: "Optional comma-separated source-country filter, e.g. lidl:CZ,lidl:DE"
        required: false
        type: string
  schedule:
    - cron: "30 6 * * *"
      timezone: "Europe/Prague"

concurrency:
  group: parkside-price-watch-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write
  actions: read
  pages: write
  id-token: write

jobs:
  crawl:
    runs-on: ubuntu-latest
    timeout-minutes: 45

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run crawler
        run: pnpm crawl --phase "${{ inputs.phase || 'phase1' }}" --sources "${{ inputs.sources || '' }}"

      - name: Validate data
        run: pnpm validate:data

      - name: Build web
        run: pnpm build:web

      - name: Upload public data and web artifact
        uses: actions/upload-artifact@v4
        with:
          name: parkside-price-watch-web
          path: |
            packages/web/dist
            data/public
            data/history
          retention-days: 30

      - name: Commit data changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/public data/history data/normalized
          if git diff --cached --quiet; then
            echo "No data changes to commit"
          else
            git commit -m "chore(data): update price snapshot"
            git push
          fi

      - name: Summary
        if: always()
        run: pnpm report:summary >> "$GITHUB_STEP_SUMMARY"
```

Poznámka: Pokud GitHub Actions v konkrétním prostředí nepodporuje `timezone`, použít UTC cron a čas přepočítat. Aktuální GitHub dokumentace uvádí výchozí UTC a možnost timezone-aware scheduling.

## 5. Deployment strategie podle fáze

### 5.1 Fáze 1

- Primárně artifact.
- Žádný veřejný deployment.
- Ruční kontrola výsledků.

### 5.2 Fáze 2

- Artifact + případně neveřejný lokální preview.
- Pokud vlastník akceptuje veřejnou dostupnost, lze zapnout GitHub Pages.
- Jinak Pages neaktivovat.

### 5.3 Fáze 3

- GitHub Pages nebo jiný statický hosting.
- Public data dataset bez interních debug informací.
- Volitelně custom domain.

## 6. GitHub Pages workflow pro fázi 3

```yaml
name: Deploy Pages

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - "packages/web/**"
      - "data/public/**"
      - ".github/workflows/deploy-pages.yml"

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:web
      - uses: actions/upload-pages-artifact@v3
        with:
          path: packages/web/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 7. Ukládání dat v GitHubu

### 7.1 Co commitovat

Ve fázi 1/2 commitovat:

- `data/public/*`;
- `data/history/price-history.jsonl` po pruningu na 30 dní;
- `data/normalized/latest-offers.jsonl` nebo obdobný latest snapshot;
- konfigurační soubory.

Nekommitovat ve velkém:

- všechny raw HTML stránky;
- Playwright screenshots;
- velké trace soubory;
- cookies/session data.

### 7.2 Raw data politika

- Parsované raw nabídky lze držet 7–30 dní.
- HTML fixture ukládat jen pro testy a reprezentativní případy.
- Raw HTML s osobními údaji, cookies nebo tracking údaji neukládat.

### 7.3 Historie 30 dní

Prune job:

```ts
function pruneHistory(records, now, days = 30) {
  const cutoff = now.minus({ days });
  return records.filter(r => DateTime.fromISO(r.scraped_at) >= cutoff);
}
```

## 8. Run status a GitHub summary

`run-status.json`:

```json
{
  "run_id": "2026-05-11T06:30:00Z",
  "started_at": "2026-05-11T06:30:00Z",
  "finished_at": "2026-05-11T06:37:12Z",
  "status": "partial_success",
  "phase": "phase1",
  "fx": {
    "source": "CNB",
    "date": "2026-05-11",
    "fallback_used": false
  },
  "summary": {
    "products_configured": 6,
    "offers_found": 18,
    "eligible_offers": 12,
    "best_prices_computed": 5
  },
  "sources": [
    {
      "source": "lidl",
      "country": "CZ",
      "status": "success",
      "parsed_offers_count": 6,
      "eligible_offers_count": 4,
      "errors": []
    }
  ]
}
```

GitHub Step Summary má zobrazit:

- celkový status;
- počet produktů;
- počet nalezených nabídek;
- chyby zdrojů;
- nejčastější quality flags;
- odkaz na artifact.

## 9. Commands

Doporučené scripts v `package.json`:

```json
{
  "scripts": {
    "crawl": "tsx packages/crawler/src/cli.ts",
    "crawl:phase1": "pnpm crawl --phase phase1",
    "fx:update": "tsx packages/comparison/src/fx-cli.ts",
    "compare": "tsx packages/comparison/src/compare-cli.ts",
    "validate:data": "tsx packages/core/src/validate-data-cli.ts",
    "build:web": "pnpm --filter @parkside/web build",
    "test": "vitest run",
    "test:watch": "vitest",
    "report:summary": "tsx packages/core/src/report-summary-cli.ts"
  }
}
```

## 10. Secrets

Fáze 1/2 by neměla potřebovat žádné secrety.

Pokud vznikne potřeba API klíčů ve fázi 3:

- ukládat do GitHub Actions Secrets;
- nikdy nedávat do public JSON;
- nikdy nepoužívat ve frontendu;
- public build musí být bez secretů.

## 11. CI testy

Minimální testy fáze 1:

- model code extraction;
- bundle classifier;
- CNB FX parser;
- conversion formula including HUF amount;
- Lidl detail single variant parser fixture;
- Lidl detail multi variant parser fixture;
- comparison best price selection;
- not-online excluded from best price.

Fáze 2:

- catalog discovery fixture;
- Kaufland direct seller parser;
- Kaufland external seller exclusion;
- product override merging;
- history pruning;
- frontend data schema validation.

## 12. Branching a PR pravidla

Doporučení:

- `main`: stabilní;
- feature branches;
- PR musí projít testy;
- parser změna musí mít fixture;
- změna datového modelu musí upravit schema a dokumentaci;
- změna matchingu musí mít acceptance test.

## 13. Observability

Ve fázi 1 stačí:

- `run-status.json`;
- GitHub Step Summary;
- console logy crawleru;
- test artifacts při selhání.

Ve fázi 2 přidat:

- `health.json`;
- parser warnings;
- top missing products;
- source success rate.

Ve fázi 3 přidat:

- issue/notifikace při opakovaném selhání;
- případně externí monitoring.
