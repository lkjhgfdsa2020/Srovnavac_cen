# Parkside Price Watch – dokumentace pro zadání vývoje

**Verze:** 0.1 draft  
**Datum:** 2026-05-11  
**Účel:** sada Markdown dokumentů pro zadání vývoje AI agentovi nebo vývojáři.

## Cíl projektu

Vybudovat webovou aplikaci pro denní sledování a porovnávání cen produktů PARKSIDE ve střední Evropě. Web má porovnávat stejný produkt / stejnou produktovou variantu napříč zeměmi a zdroji, zobrazit lokální cenu, cenu přepočtenou do CZK podle kurzů ČNB a zvýraznit nejvýhodnější aktuální nabídku.

## Potvrzená rozhodnutí

- Hlavní měna webu: **CZK**.
- Kurzové přepočty: **ČNB**.
- Cena pro porovnání: **pouze produktová cena bez dopravy**.
- Historie cen: **30 dní**.
- Provoz: **GitHub**, denní běh 1× denně + ruční spuštění.
- Fáze 1: pouze několik ručně vybraných produktů.
- Fáze 2: automaticky vytvářený katalog všech dostupných PARKSIDE online produktů.
- Lidl: zaměřit se na produkty, které jsou dostupné k online nákupu.
- Kaufland: v MVP zahrnovat pouze přímý prodej Kaufland/Lidl, žádné externí marketplace prodejce.
- Produkty se musí porovnávat jen jako **stejná věc**, tedy stejný model a stejný bundle: bez baterie, s baterií, s nabíječkou, vícedílná sada apod.
- U produktů je nutné jít na **detailní stránku**, protože detail může obsahovat více variant, které jsou reálně jiné produkty.
- Cenové alerty nejsou součást MVP.
- Web má být pro fázi 1 a 2 primárně pro osobní použití; veřejný režim až od fáze 3.

## Důležitá nuance: Maďarsko

Lidl HU má veřejné PARKSIDE stránky, ale podle oficiální zákaznické podpory Lidl Magyarország aktuálně neumožňuje standardní online objednávky ani doručení. Proto je Maďarsko v MVP vedené jako zvláštní případ:

- pokud produkt na Lidl HU detailu nemá možnost online nákupu, nabídka se **nezahrne do hlavního porovnání**;
- může se uložit jako `not_online_purchasable` nebo `monitor_only`, aby bylo vidět, že produkt existuje, ale nesplňuje pravidlo MVP;
- pokud se objeví Click&Pick/předobjednávkový mechanismus nebo jiná online forma nákupu, connector ho může zpracovat, ale musí to být explicitně označeno.

## Dokumenty

| Soubor | Účel |
|---|---|
| `00-rozhodnuti-a-rozsah.md` | Shrnutí rozhodnutí, předpokladů, omezení a otevřených bodů. |
| `01-requirements-faze-1-2-3.md` | Detailní funkční a nefunkční požadavky pro fáze 1, 2 a 3. |
| `02-architektura.md` | Návrh technické architektury, modulů, pipeline a repozitáře. |
| `03-datovy-model-a-parovani.md` | Datový model, pravidla produktového párování a variant. |
| `04-crawlery-a-zdroje.md` | Požadavky na crawlery, zdroje, detailní stránky, varianty a Kaufland direct-only filtr. |
| `05-frontend-ux.md` | Požadavky na tabulku, detail produktu, filtry, stavy a UX. |
| `06-github-provoz.md` | GitHub Actions, ukládání dat, build, retence a deployment. |
| `07-ai-agent-zadani-a-backlog.md` | Zadání pro AI agenta, backlog, epiky, implementační postup a Definition of Done. |
| `08-priklady-konfigurace.md` | Ukázkové YAML/JSON konfigurace, seed produkty, schemas a výstupy. |

## Doporučený postup pro AI agenta

1. Přečíst `00-rozhodnuti-a-rozsah.md` a `01-requirements-faze-1-2-3.md`.
2. Implementovat pouze **fázi 1**, pokud není výslovně zadáno jinak.
3. Nejprve vybudovat datový model, validace a konfiguraci seed produktů.
4. Implementovat CNB kurzový modul.
5. Implementovat Lidl detail-page crawler pro jednu zemi a otestovat varianty.
6. Rozšířit Lidl connector na další země.
7. Přidat porovnávací engine a frontendovou tabulku.
8. Přidat GitHub Actions pro ruční a denní běh.
9. Až po splnění acceptance criteria fáze 1 začít fázi 2.

## Referenční oficiální zdroje

- GitHub Actions workflow syntax: https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
- GitHub Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- ČNB kurzy devizového trhu: https://www.cnb.cz/cs/casto-kladene-dotazy/Kurzy-devizoveho-trhu-na-www-strankach-CNB/
- ČNB exchange rate fixing EN: https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/
- Kaufland Global Marketplace: https://www.kauflandglobalmarketplace.com/en/
- Kaufland Seller API: https://sellerapi.kaufland.com/?page=rest-api
- Lidl CZ PARKSIDE: https://www.lidl.cz/c/parkside/s10068914
- Lidl SK PARKSIDE: https://www.lidl.sk/c/parkside/s10068914
- Lidl PL PARKSIDE: https://www.lidl.pl/c/parkside/s10068914
- Lidl HU PARKSIDE: https://www.lidl.hu/c/parkside/s10068914
- Lidl AT PARKSIDE: https://www.lidl.at/c/parkside/s10068914
- Lidl DE PARKSIDE: https://www.lidl.de/c/parkside/s10068914


---

# 00 – Rozhodnutí, rozsah a předpoklady

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Product statement

Projekt „Parkside Price Watch“ má uživateli rychle odpovědět na otázku:

> Ve které sledované zemi a u kterého podporovaného zdroje je konkrétní PARKSIDE produkt aktuálně nejlevnější, pokud porovnávám stejnou variantu produktu a cenu bez dopravy?

Výsledkem má být osobní cenový dashboard se srovnávací tabulkou, podporou historických cen za 30 dní a jasným označením kvality párování.

## 2. Sledované země

| Země | Kód | Měna | Stav pro MVP |
|---|---:|---:|---|
| Česko | `CZ` | CZK | Plná podpora. |
| Slovensko | `SK` | EUR | Plná podpora pro online produkty. |
| Polsko | `PL` | PLN | Plná podpora pro online produkty. |
| Maďarsko | `HU` | HUF | Zvláštní případ: Lidl HU aktuálně nemá standardní online nákup/doručení; zahrnout jen pokud konkrétní produkt splní online-purchase pravidlo. |
| Rakousko | `AT` | EUR | Plná podpora pro online produkty. |
| Německo | `DE` | EUR | Plná podpora pro online produkty. |

## 3. Sledované zdroje podle fází

### Fáze 1

Primárně Lidl e-shop / Lidl online detail produktů.

- Lidl CZ/SK/PL/AT/DE: podporované jako online zdroje.
- Lidl HU: pouze jako zvláštní případ, pokud produkt umožňuje online/předobjednávkový nákup.
- Kaufland: pouze volitelný technický spike pro ověření přímého prodeje; není podmínkou úspěchu fáze 1.

### Fáze 2

Lidl + Kaufland.

- Lidl: automaticky zjišťovat všechny online dostupné produkty PARKSIDE.
- Kaufland: zahrnout pouze nabídky, kde je prodejce přímo Kaufland/Lidl nebo jiný výslovně povolený direct seller.
- Externí marketplace prodejci musí být vyloučeni z hlavního porovnání.

### Fáze 3

Rozšíření o další srovnávače a lokální e-shopy.

- Heureka.
- Idealo.
- Geizhals. Poznámka: uživatelský výraz „Gizhouse“ je interpretován jako „Geizhals“, je vhodné to ještě potvrdit před implementací.
- Allegro.
- Lokální e-shopy pro CZ/SK/PL/HU/AT/DE.
- Veřejný režim webu.
- Možné externí úložiště/databáze, pokud GitHub přestane stačit.

## 4. Potvrzená pravidla porovnání

| Oblast | Rozhodnutí |
|---|---|
| Referenční měna | CZK. |
| Kurzový zdroj | ČNB. |
| Zobrazované ceny | Lokální cena + přepočet do CZK. |
| Porovnávaná cena | Produktová cena bez dopravy. |
| Doprava | Nezapočítávat do výběru nejlepší ceny. Může být uložená informativně, pokud je snadno dostupná, ale nesmí ovlivnit MVP výsledek. |
| Dostupnost | Zahrnout jen produkty dostupné k online nákupu. |
| Marketplace | Kaufland pouze přímý prodej Kaufland/Lidl, žádní externí prodejci v MVP. |
| Varianty | Porovnávat pouze stejný model a stejný bundle. |
| Historie | 30 dní. |
| Frekvence sběru | Denně 1× + ručně přes GitHub Actions. |
| Cenové alerty | Nejsou součástí fáze 1 ani 2. |
| Veřejnost webu | Fáze 1/2 osobní použití; veřejný režim až fáze 3. |

## 5. Co znamená „stejný produkt“

Za stejný produkt lze považovat pouze nabídky, které mají shodu v těchto atributech:

1. značka a produktová řada, například `PARKSIDE` nebo `PARKSIDE PERFORMANCE`;
2. modelový kód, například `PWS 230 E5`;
3. typ produktu, například úhlová bruska / aku rázový utahovák;
4. bundle varianta, například:
   - bez akumulátoru a nabíječky;
   - s akumulátorem;
   - s akumulátorem a nabíječkou;
   - sada 2 ks;
   - více variant příslušenství na jednom detailu;
5. zásadní parametry, například kapacita baterie, napětí, výkon, délka lišty, počet dílů v sadě.

Produkt nesmí být označen jako stejný jen proto, že má podobný název. U PARKSIDE je nutné počítat s tím, že jeden Lidl detail může obsahovat několik variant, které jsou prakticky samostatné produkty.

## 6. Fáze 1 seed produkty

Fáze 1 sleduje následující konkrétní produkty:

| Canonical ID | Název | Modelový kód | Kritická varianta |
|---|---|---|---|
| `parkside-petps-1100-a1` | Ponorné kalové čerpadlo PETPS 1100 A1 | `PETPS 1100 A1` | Přesný model. |
| `parkside-pws-230-e5` | Úhlová bruska PWS 230 E5 | `PWS 230 E5` | Přesný model. |
| `parkside-papp-2012-a1-12ah-2pcs` | Sada Smart akumulátor 12 Ah PAPP 2012 A1, 2dílná | `PAPP 2012 A1` | 12 Ah, Smart, 2dílná sada. |
| `parkside-pdssa-20-li-b2-smart-4ah` | Aku rázový utahovák PDSSA 20-Li B2, Smart 4 Ah | `PDSSA 20-Li B2` | Obsahuje Smart 4 Ah akumulátor. |
| `parkside-ppbks-56-b2-electric-start` | Benzínová řetězová pila s elektrickým startováním PPBKS 56 B2 | `PPBKS 56 B2` | Elektrické startování. |
| `parkside-pamt-20-li-a1-no-battery` | Aku kombinovaná strunová sekačka 3 v 1 PAMT 20-Li A1 – bez akumulátoru a nabíječky | `PAMT 20-Li A1` | Bez akumulátoru a nabíječky. |

## 7. Explicitní out-of-scope pro fázi 1 a 2

- Započítávání dopravy do ceny.
- Marketplace třetích stran na Kauflandu.
- Cenové alerty.
- Uživatelské účty.
- Veřejné API.
- Externí databáze.
- Porovnávání kamenných prodejen.
- Agresivní scraping, obcházení ochran, captchy, proxy rotace.
- Porovnání neekvivalentních bundle variant.

## 8. Důležité architektonické rozhodnutí: osobní web vs GitHub Pages

GitHub Pages je vhodný pro statický web, ale Pages web je obecně veřejně dostupný. Pro fázi 1 a 2, kde má být projekt osobní, se doporučuje:

1. držet repozitář privátní;
2. generovat statický web jako GitHub Actions artifact;
3. lokálně si web otevřít po stažení artifactu;
4. GitHub Pages zapnout až ve fázi 3, kdy má být web veřejný.

Alternativně lze GitHub Pages použít už ve fázi 1/2, ale pouze pokud nevadí veřejná dostupnost výsledného webu.

## 9. Otevřené otázky

| ID | Otázka | Dopad |
|---|---|---|
| OQ-001 | Má se pro fázi 1 vyžadovat pokrytí všech zemí, nebo stačí prokázat funkčnost na CZ/SK/DE a zbytek doplnit ve fázi 2? | Rozsah crawlerů. |
| OQ-002 | Jaké přesné názvy prodejců na Kauflandu mají být považovány za přímý prodej? | Direct-only filtr. |
| OQ-003 | Má se HU zobrazovat v tabulce i tehdy, když produkt nelze online koupit? | UX a pravidla dostupnosti. |
| OQ-004 | V jaký čas má běžet denní sběr? | GitHub Actions schedule. |
| OQ-005 | Má se pro Phase 1 ukládat i raw HTML pro test fixtures, nebo pouze parsované raw nabídky? | Velikost repozitáře. |
| OQ-006 | Potvrdit, že „Gizhouse“ znamená Geizhals. | Scope fáze 3. |

## 10. Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---:|---:|---|
| Změny HTML struktury Lidl/Kaufland | Vysoká | Vysoký | Test fixtures, parser health check, oddělené connectory. |
| Varianty na detailu budou složité | Vysoká | Vysoký | Detail-only parsing, variant-level data model, match confidence. |
| Maďarsko bez online nákupu | Vysoká | Střední | Označit jako `not_online_purchasable`, nezahrnovat do best price. |
| Kaufland má hlavně externí prodejce | Střední | Střední | Direct-seller allowlist, fallback na Lidl. |
| Nespolehlivé automatické párování | Vysoká | Vysoký | Confidence score, ruční override přes YAML. |
| GitHub repo naroste kvůli historii/raw datům | Střední | Střední | 30denní retence, raw HTML jen fixtures. |
| GitHub Pages veřejnost | Vysoká | Střední | Ve fázi 1/2 používat artifact/local preview. |
| Anti-bot/rate limiting | Střední | Vysoký | Nízká frekvence, respektovat pravidla, žádné obcházení. |


---

# 01 – Detailní requirements pro fáze 1, 2 a 3

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. Přehled fází

| Fáze | Název | Hlavní cíl | Výstup |
|---|---|---|---|
| Fáze 1 | Proof of Concept / MVP alpha | Ověřit, že umíme pro vybrané produkty získat detailní online ceny, správně rozpoznat varianty a porovnat je v CZK. | Funkční osobní statický dashboard pro 6 produktů, primárně Lidl. |
| Fáze 2 | MVP complete | Automaticky objevit a sledovat všechny dostupné online PARKSIDE produkty v podporovaných zemích; přidat Kaufland direct-only. | Plnohodnotný osobní srovnávač všech online PARKSIDE produktů Lidl + direct Kaufland. |
| Fáze 3 | Rozšíření a public verze | Přidat srovnávače a lokální e-shopy, veřejný web, robustnější provoz a případně externí databázi. | Veřejně použitelný cenový srovnávač s více zdroji. |

## 2. Obecné požadavky platné pro všechny fáze

### 2.1 Funkční princip

Systém musí:

1. získat data o produktových nabídkách ze zdrojů;
2. normalizovat lokální ceny, měny a dostupnost;
3. převést cenu do CZK kurzem ČNB;
4. spárovat nabídky na interní canonical produkt a canonical variantu;
5. určit nejlepší dostupnou nabídku podle produktové ceny bez dopravy;
6. zobrazit srovnávací tabulku;
7. uchovat historii cen 30 dní;
8. umožnit denní i ruční spuštění sběru.

### 2.2 Definice „nejlepší ceny“

Nejlepší cena je nejnižší hodnota `price_czk`, která splňuje všechny podmínky:

- nabídka je dostupná pro online nákup;
- nabídka je ze zdroje a země podporované v dané fázi;
- u Kauflandu jde o přímý prodejce z allowlistu;
- produktové párování je potvrzené nebo má confidence nad limitem;
- cena je produktová cena bez dopravy;
- kurz ČNB je dostupný nebo je použit poslední známý kurz s jasným označením.

Pokud je více nabídek se stejnou cenou po zaokrouhlení, web zobrazí všechny jako sdílené nejlepší nabídky.

### 2.3 Stav nabídky

Systém musí rozlišovat minimálně tyto stavy:

| Stav | Význam | Zahrnout do best price? |
|---|---|---:|
| `online_available` | Lze online koupit / přidat do košíku. | Ano |
| `online_preorder` | Lze online předobjednat / Click&Pick, pokud je podporováno. | Volitelně ano, ale označit. |
| `out_of_stock` | Produkt existuje, ale není skladem. | Ne |
| `not_online_purchasable` | Produkt je jen informativní nebo jen v prodejně. | Ne |
| `unknown` | Parser neumí určit dostupnost. | Ne |
| `source_error` | Zdroj se nepodařilo načíst. | Ne |

### 2.4 Kvalita dat

Každý výsledek musí nést informace o kvalitě:

- `match_confidence` v rozsahu 0–1;
- `match_method`, například `ean`, `model_code_exact`, `manual_override`, `model_plus_bundle`, `name_similarity`;
- `quality_flags`, například `variant_uncertain`, `seller_unknown`, `fx_fallback_used`, `stale_data`, `missing_model_code`;
- `scraped_at` timestamp;
- `source_url`.

## 3. Fáze 1 – Proof of Concept / MVP alpha

### 3.1 Cíl fáze 1

Ověřit celý řetězec na omezeném seznamu produktů:

- detail-page scraping;
- variant-level parsing;
- přesné párování variant;
- přepočet měn ČNB;
- výběr nejlepší ceny;
- osobní statický dashboard;
- GitHub Actions denní a ruční běh.

### 3.2 Rozsah fáze 1

#### Produkty

Fáze 1 sleduje přesně těchto 6 seed produktů:

1. Ponorné kalové čerpadlo PETPS 1100 A1.
2. Úhlová bruska PWS 230 E5.
3. Sada Smart akumulátor 12 Ah PAPP 2012 A1, 2dílná.
4. Aku rázový utahovák PDSSA 20-Li B2, Smart 4 Ah.
5. Benzínová řetězová pila s elektrickým startováním PPBKS 56 B2.
6. Aku kombinovaná strunová sekačka 3 v 1 PAMT 20-Li A1 – bez akumulátoru a nabíječky.

#### Země

- CZ, SK, PL, AT, DE: primární podpora.
- HU: zpracovat jen pokud je nabídka online/předobjednávkově dostupná; jinak zobrazit jako nepodporovanou pro online nákup.

#### Zdroje

- Povinné: Lidl detail produktů.
- Nepovinné pro fázi 1: Kaufland direct-only spike.

### 3.3 Funkční požadavky fáze 1

| ID | Requirement | Priorita | Acceptance criteria |
|---|---|---:|---|
| F1-FR-001 | Systém má konfigurovatelný seznam seed produktů v YAML/JSON. | P0 | V repozitáři existuje `config/products.seed.yml` se 6 produkty a modelovými kódy. |
| F1-FR-002 | Systém umí pro seed produkt vytvořit hledací dotazy podle modelového kódu a aliasů. | P0 | Pro každý seed existuje `model_code`, český název a aliasy. |
| F1-FR-003 | Systém získává cenu z detailní stránky produktu, nikoli jen z kartičky v kategorii. | P0 | Parser má test, který pracuje s detail fixture a ověří varianty. |
| F1-FR-004 | Systém umí rozpoznat varianty na jednom detailu jako samostatné nabídky. | P0 | Pokud detail obsahuje varianty, vznikne samostatný `Offer` pro každou variantu. |
| F1-FR-005 | Systém porovnává jen správnou seed variantu. | P0 | Sada 2 ks se nesrovná s 1 ks; „bez baterie“ se nesrovná s „s baterií“. |
| F1-FR-006 | Systém ukládá lokální cenu a měnu. | P0 | Nabídka obsahuje `price`, `currency`, `price_czk`. |
| F1-FR-007 | Systém používá kurz ČNB pro EUR, PLN a HUF. | P0 | Přepočet zohledňuje `amount` u měn jako HUF. |
| F1-FR-008 | Systém vybírá nejlepší nabídku podle produktové ceny bez dopravy. | P0 | Nejlevnější dostupná nabídka má `is_best=true`. |
| F1-FR-009 | Systém nezahrnuje nedostupné nebo ne-online nabídky do best price. | P0 | `out_of_stock` a `not_online_purchasable` mají `eligible_for_best_price=false`. |
| F1-FR-010 | Systém ukládá historii cen 30 dní. | P0 | Po každém běhu se přidá snapshot; starší než 30 dní se prořezávají. |
| F1-FR-011 | Web zobrazuje srovnávací tabulku se zvýrazněním nejlepší ceny. | P0 | U každého produktu je vidět nejlepší cena a země/zdroj. |
| F1-FR-012 | Web zobrazuje lokální cenu i přepočet do CZK. | P0 | Buňky zobrazují například `99,99 € / 2 433 Kč`. |
| F1-FR-013 | Web zobrazuje datum posledního ověření. | P0 | Každá buňka má timestamp nebo tooltip. |
| F1-FR-014 | Systém generuje run status. | P1 | Existuje `data/public/run-status.json` s výsledkem posledního běhu. |
| F1-FR-015 | Uživatel může ručně spustit sběr z GitHub Actions. | P0 | Workflow obsahuje `workflow_dispatch`. |
| F1-FR-016 | Sběr běží automaticky 1× denně. | P0 | Workflow obsahuje `schedule`. |
| F1-FR-017 | Systém vytvoří CSV export aktuální tabulky. | P1 | Existuje `data/public/latest-comparison.csv`. |
| F1-FR-018 | Systém podporuje debug report pro nenalezené produkty. | P1 | Report ukáže `not_found`, `variant_mismatch`, `not_online_purchasable`. |

### 3.4 Nefunkční požadavky fáze 1

| ID | Requirement | Priorita | Acceptance criteria |
|---|---|---:|---|
| F1-NFR-001 | Projekt běží bez placených služeb. | P0 | Žádná externí DB, žádné placené API. |
| F1-NFR-002 | Data jsou uložená v GitHub repozitáři nebo workflow artifacts. | P0 | Crawler nevyžaduje externí storage. |
| F1-NFR-003 | Parsery mají test fixtures. | P0 | Minimálně 1 fixture pro každý implementovaný typ parseru. |
| F1-NFR-004 | Selhání jedné země nesmí shodit celý běh. | P0 | Run status ukáže chybu země, ostatní výsledky se zpracují. |
| F1-NFR-005 | Crawler má nízkou frekvenci požadavků. | P0 | Konfigurovatelný delay a concurrency. |
| F1-NFR-006 | Systém nesmí obcházet ochrany webů. | P0 | Žádné proxy rotace, captcha bypass ani spoofing nad rámec běžného browser user-agentu. |
| F1-NFR-007 | Frontend je statický. | P0 | Lze otevřít bez backend serveru. |
| F1-NFR-008 | Žádné secrety ve frontendu. | P0 | Build neobsahuje secrets. |
| F1-NFR-009 | Web je použitelný na mobilu. | P1 | Tabulka se dá horizontálně scrollovat a detail je responzivní. |
| F1-NFR-010 | GitHub Pages není povinný pro fázi 1. | P0 | Build artifact stačí; Pages až volitelně. |

### 3.5 Výstupy fáze 1

| Výstup | Povinný? | Popis |
|---|---:|---|
| `data/public/latest-comparison.json` | Ano | Hlavní JSON pro frontend. |
| `data/public/latest-comparison.csv` | Ano | CSV export aktuálního srovnání. |
| `data/public/run-status.json` | Ano | Stav posledního sběru. |
| `data/history/price-history.jsonl` | Ano | 30denní historie. |
| `web/dist` nebo artifact | Ano | Statický frontend. |
| `tests/fixtures` | Ano | Uložené testovací vzorky parserů. |
| `docs/parser-notes.md` | Volitelné | Poznámky k selectorům a variantám. |

### 3.6 Definition of Done fáze 1

Fáze 1 je hotová, když:

- existuje repozitářová struktura podle architektury;
- běží lokální příkaz `pnpm crawl` nebo ekvivalent;
- běží lokální příkaz `pnpm build:web` nebo ekvivalent;
- GitHub Actions umí ruční a denní běh;
- 6 seed produktů je v konfiguraci;
- minimálně jedna země má reálné úspěšné načtení a ostatní země mají korektní status;
- systém nerozbije porovnání při chybě jedné země;
- web zobrazí tabulku, nejlepší cenu, lokální cenu a CZK přepočet;
- historie se ukládá a ořezává na 30 dní;
- existují testy pro CNB FX parser, product matcher a aspoň jeden Lidl detail parser.

## 4. Fáze 2 – MVP complete

### 4.1 Cíl fáze 2

Rozšířit projekt z ručně definovaných seed produktů na automatický katalog všech online dostupných PARKSIDE produktů v podporovaných zemích a doplnit Kaufland direct-only zdroj.

### 4.2 Rozsah fáze 2

#### Produkty

- Všechny PARKSIDE a PARKSIDE PERFORMANCE produkty dostupné online v podporovaných Lidl zemích.
- Produkty direct-only dostupné na Kaufland marketplacech, pokud prodejce splní allowlist.

#### Zdroje

- Lidl CZ/SK/PL/AT/DE, HU pouze pokud online/předobjednávkově dostupné.
- Kaufland CZ/SK/PL/AT/DE podle dostupnosti marketplace; HU není pro Kaufland MVP podporovaná, pokud nebude existovat odpovídající marketplace.

### 4.3 Funkční požadavky fáze 2

| ID | Requirement | Priorita | Acceptance criteria |
|---|---|---:|---|
| F2-FR-001 | Systém automaticky objevuje PARKSIDE produkty z kategorií/brand stránek. | P0 | Nový online PARKSIDE produkt se objeví bez ruční konfigurace. |
| F2-FR-002 | Systém vytváří canonical katalog automaticky. | P0 | Nový produkt získá canonical kandidáta s modelem, variantou a confidence. |
| F2-FR-003 | Systém podporuje ruční override automatického katalogu. | P0 | `config/product-overrides.yml` umí sloučit/rozdělit produkty. |
| F2-FR-004 | Systém rozlišuje bundle varianty. | P0 | Varianty „bez baterie“, „s baterií“ a „s nabíječkou“ mají jiné canonical variant IDs. |
| F2-FR-005 | Systém podporuje Kaufland direct-only. | P0 | Externí prodejci nejsou v `latest-comparison.json`. |
| F2-FR-006 | Systém eviduje vyloučené Kaufland nabídky souhrnně. | P1 | Run status ukáže počet vyloučených externích prodejců. |
| F2-FR-007 | Web umí filtrovat podle země, zdroje, kategorie, dostupnosti a battery systému. | P0 | Filtry fungují nad public JSON daty. |
| F2-FR-008 | Web má detail produktu s historií ceny za 30 dní. | P0 | Detail zobrazuje graf nebo tabulku historie. |
| F2-FR-009 | Web zobrazuje důvod nejistého párování. | P1 | Tooltip nebo detail ukáže match method a flags. |
| F2-FR-010 | Systém má health dashboard. | P1 | Web nebo report ukáže úspěšnost zdrojů, počty produktů a chyby. |
| F2-FR-011 | Systém detekuje produkty, které zmizely z katalogu. | P1 | Produkt dostane status `not_seen_today` / `stale`. |
| F2-FR-012 | Systém podporuje export celého katalogu. | P1 | Existuje CSV/JSON pro katalog a nabídky. |
| F2-FR-013 | Systém umí označit největší mezery v datech. | P2 | Report například ukáže produkty dostupné jen v jedné zemi. |
| F2-FR-014 | Systém podporuje více zdrojů na jednu zemi. | P0 | Například `CZ Lidl` a `CZ Kaufland direct`. |

### 4.4 Nefunkční požadavky fáze 2

| ID | Requirement | Priorita | Acceptance criteria |
|---|---|---:|---|
| F2-NFR-001 | Systém zpracuje minimálně 1 000 produktových variant bez backend serveru. | P0 | Frontend se načte v rozumném čase ze statického JSON. |
| F2-NFR-002 | Data zůstanou v GitHubu. | P0 | Žádná povinná externí DB. |
| F2-NFR-003 | Parser health testy běží v CI. | P0 | Při změně parseru běží fixture testy. |
| F2-NFR-004 | Crawler má retry s backoffem. | P1 | Dočasná chyba zdroje se zopakuje, ale neagresivně. |
| F2-NFR-005 | Výstupní data jsou validovaná schématem. | P0 | CI failne při nevalidním JSON. |
| F2-NFR-006 | Katalogové párování je auditovatelné. | P0 | U každé vazby je metoda a confidence. |
| F2-NFR-007 | Repozitář má kontrolu velikosti dat. | P1 | Prune job drží 30 dní historie a omezený počet raw fixtures. |

### 4.5 Definition of Done fáze 2

Fáze 2 je hotová, když:

- crawler automaticky objeví PARKSIDE produkty v podporovaných zemích;
- automatický katalog má možnost ručního override;
- Kaufland direct-only funguje a externí prodejci nejsou v porovnání;
- web obsahuje filtry, detail produktu, historii 30 dní a health dashboard;
- GitHub Actions běží stabilně denně;
- datové výstupy mají validaci;
- existuje přehled chyb a datové kvality;
- 30denní historie se drží bez nekontrolovaného růstu repozitáře.

## 5. Fáze 3 – Rozšíření a veřejná verze

### 5.1 Cíl fáze 3

Rozšířit cenový monitoring mimo Lidl/Kaufland, zpřístupnit web veřejně a zvýšit robustnost provozu.

### 5.2 Rozsah fáze 3

- Heureka.
- Idealo.
- Geizhals.
- Allegro.
- Lokální e-shopy.
- Veřejné nasazení.
- Možná externí databáze.
- Rozšířená compliance a monitoring.

### 5.3 Funkční požadavky fáze 3

| ID | Requirement | Priorita | Acceptance criteria |
|---|---|---:|---|
| F3-FR-001 | Systém podporuje více typů zdrojů: retailer, marketplace, price-comparison. | P0 | Každý zdroj má typ a vlastní pravidla. |
| F3-FR-002 | Systém podporuje srovnávače Heureka, Idealo, Geizhals a Allegro. | P1 | Každý nový zdroj má connector a compliance poznámku. |
| F3-FR-003 | Systém podporuje lokální e-shopy. | P1 | Lokální e-shop connector lze přidat konfigurací. |
| F3-FR-004 | Web má veřejný režim s jasným disclaimerem. | P0 | Uživatel vidí, že ceny jsou orientační a timestampované. |
| F3-FR-005 | Web má možnost schovat nejisté výsledky. | P0 | Filtr `only_verified_matches`. |
| F3-FR-006 | Systém podporuje delší historii, pokud je zapojena externí DB. | P2 | Možnost 90+ dní bez nafukování GitHub repozitáře. |
| F3-FR-007 | Systém má veřejný changelog dat. | P2 | Uživatel vidí poslední aktualizaci zdrojů. |
| F3-FR-008 | Systém má mechanismus pro nahlášení špatného párování. | P2 | Formulář nebo issue link. |
| F3-FR-009 | Systém může generovat sitemap/SEO jen pro veřejný režim. | P2 | Veřejné stránky lze indexovat. |

### 5.4 Nefunkční požadavky fáze 3

| ID | Requirement | Priorita | Acceptance criteria |
|---|---|---:|---|
| F3-NFR-001 | Veřejný web nesmí vystavovat citlivé údaje ani interní debug informace. | P0 | Public build má oddělený dataset. |
| F3-NFR-002 | Pro veřejný provoz existuje compliance review zdrojů. | P0 | Každý zdroj má popsaná pravidla použití. |
| F3-NFR-003 | Systém má monitoring selhání. | P1 | Minimálně GitHub Actions summary + issue nebo notifikace. |
| F3-NFR-004 | Pokud GitHub storage nestačí, přejít na externí DB/storage. | P1 | Architektura podporuje storage adapter. |
| F3-NFR-005 | Systém musí mít rate-limit per source. | P0 | Konfigurovatelný delay a concurrency per source. |

### 5.5 Definition of Done fáze 3

Fáze 3 je hotová, když:

- jsou přidány alespoň 2 nové zdroje mimo Lidl/Kaufland;
- web lze bezpečně zveřejnit;
- nejistá párování jsou jasně označená nebo filtrovatelná;
- existuje compliance evidence ke zdrojům;
- provoz má monitoring a datový changelog;
- architektura je připravena na externí DB/storage.

## 6. Obecné acceptance test scénáře

### ATS-001 – Stejný model, jiná země

**Given:** Produkt `PWS 230 E5` je nalezen v CZ a DE.  
**When:** Obě nabídky mají přesný model a jsou online dostupné.  
**Then:** Zobrazí se v jednom řádku a nejnižší přepočtená CZK cena je zvýrazněná.

### ATS-002 – Stejný detail, více variant

**Given:** Lidl detail obsahuje varianty příslušenství.  
**When:** Parser detail načte.  
**Then:** Každá varianta je samostatný `Offer` a do porovnání se zahrne jen varianta odpovídající canonical produktu.

### ATS-003 – Baterie 12 Ah 2dílná vs jednodílná

**Given:** Jedna země má `PAPP 2012 A1 2dílná sada`, druhá jen `PAPP 2012 A1 1 ks`.  
**When:** Matcher vyhodnotí nabídky.  
**Then:** Nabídky se nesmí porovnat jako stejný produkt.

### ATS-004 – Bez baterie vs s baterií

**Given:** `PAMT 20-Li A1` bez baterie je v jedné zemi a verze s baterií v jiné.  
**When:** Matcher vyhodnotí nabídky.  
**Then:** Vzniknou různé canonical varianty nebo se nabídka odmítne jako `bundle_mismatch`.

### ATS-005 – Kaufland externí prodejce

**Given:** Kaufland detail/listing ukazuje nabídku od externího prodejce.  
**When:** Kaufland connector zpracuje nabídku.  
**Then:** Nabídka není součástí `latest-comparison.json` a může být započtena jen v debug statistice jako excluded.

### ATS-006 – Chybějící kurz ČNB

**Given:** ČNB API není dostupné.  
**When:** Proběhne crawl.  
**Then:** Systém použije poslední známý kurz, nastaví `fx_fallback_used` a označí výsledek jako méně kvalitní; běh nesmí spadnout.

### ATS-007 – HU bez online nákupu

**Given:** Produkt existuje na Lidl HU, ale nejde online koupit.  
**When:** Connector načte detail.  
**Then:** Nabídka je označena `not_online_purchasable` a nesoutěží o nejlepší cenu.


---

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


---

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


---

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


---

# 05 – Frontend a UX požadavky

**Verze:** 0.1 draft  
**Datum:** 2026-05-11

## 1. UX cíl

Web má sloužit hlavně pro rychlé rozhodnutí:

> Kde je konkrétní PARKSIDE produkt aktuálně nejlevnější, když porovnám stejnou variantu a cenu bez dopravy?

Primární pohled je proto tabulka. Detail produktu a historie jsou sekundární, ale důležité pro ověření.

## 2. Informační hierarchie

### 2.1 Hlavní stránka

Hlavní stránka obsahuje:

1. stav posledního sběru dat;
2. informaci o kurzu ČNB a datu kurzu;
3. filtry;
4. srovnávací tabulku;
5. odkaz na CSV export;
6. legendu stavů a kvality dat.

### 2.2 Detail produktu

Detail produktu obsahuje:

1. název produktu;
2. model code;
3. bundle summary;
4. aktuální nabídky podle zemí/zdrojů;
5. historii ceny za 30 dní;
6. odkazy na zdrojové detaily;
7. match/debug informace;
8. quality flags.

## 3. Hlavní tabulka

### 3.1 Sloupce fáze 1

Ve fázi 1, kde je primární Lidl:

| Sloupec | Popis |
|---|---|
| Produkt | Název, model, bundle. |
| CZ Lidl | Cena v CZK. |
| SK Lidl | Lokální cena EUR + CZK. |
| PL Lidl | Lokální cena PLN + CZK. |
| HU Lidl | HUF + CZK, nebo stav nepodporováno/neonline. |
| AT Lidl | EUR + CZK. |
| DE Lidl | EUR + CZK. |
| Nejlepší | Země/zdroj s nejlepší cenou. |
| Aktualizováno | Poslední validní scrape. |

### 3.2 Sloupce fáze 2

Ve fázi 2 přibude zdrojová granularita:

| Sloupec | Příklad |
|---|---|
| CZ Lidl | `2 999 Kč` |
| CZ Kaufland direct | `3 099 Kč` |
| SK Lidl | `119,99 € / 2 920 Kč` |
| SK Kaufland direct | `—` |
| PL Lidl | `499 zł / 2 864 Kč` |
| AT Lidl | `99,99 € / 2 433 Kč` |
| DE Lidl | `89,99 € / 2 190 Kč` |

Při větším počtu sloupců musí být možné sloupce filtrovat nebo sbalit podle země.

## 4. Buňka tabulky

Každá cenová buňka má obsahovat:

- lokální cenu;
- cenu v CZK;
- stav dostupnosti;
- zdrojový odkaz;
- timestamp;
- quality flags v tooltipu.

Příklad textového obsahu:

```text
99,99 €
2 433 Kč
Skladem online
ověřeno 2026-05-11 06:32
```

## 5. Barevné a stavové značení

| Stav | Doporučené značení |
|---|---|
| Nejlepší cena | Zvýraznit zeleným pozadím nebo štítkem `nejlepší`. |
| Druhá nejlepší / mírně dražší | Volitelně světlejší zvýraznění. |
| Nedostupné | Šedá buňka, text `nedostupné`. |
| Není online | Šedá buňka, text `není online nákup`. |
| Nenalezeno | `—` + tooltip. |
| Nejisté párování | Oranžový warning icon/štítek. |
| Chyba zdroje | Červený nebo výrazný warning, ale bez dramatického UX. |
| Stará data | Štítek `stale`. |

Barvy musí být doplněny textem/ikonou, aby informace nebyla závislá jen na barvě.

## 6. Výpočet delta

U každé nabídky mimo nejlepší cenu se zobrazí rozdíl:

- `+123 Kč`;
- `+8,4 %`.

Příklad:

```text
119,99 € / 2 920 Kč
+430 Kč / +17,1 %
```

Delta se počítá proti nejlepší eligible nabídce stejné canonical varianty.

## 7. Filtry

### 7.1 Fáze 1

Povinné filtry:

- dostupné online pouze / všechny stavy;
- země;
- zdroj;
- ukázat jen produkty s nalezenou nejlepší cenou;
- ukázat warningy.

### 7.2 Fáze 2

Přidat:

- kategorie;
- battery platform: X12V, X20V, X20V Smart, žádná;
- bundle type;
- pouze potvrzené párování;
- pouze Lidl;
- Lidl + Kaufland direct;
- dostupné ve více než jedné zemi;
- produkty s největším rozdílem ceny.

### 7.3 Fáze 3

Přidat:

- srovnávače vs retail;
- lokální e-shopy;
- veřejný filtr `hide_uncertain` jako výchozí;
- země původu prodejce, pokud je dostupná;
- trusted sellers.

## 8. Detail produktu

Detail má zobrazit:

```text
PARKSIDE Aku kombinovaná strunová sekačka 3 v 1 PAMT 20-Li A1
Model: PAMT 20-Li A1
Varianta: bez akumulátoru a nabíječky
Battery platform: X20V
Porovnáváno bez dopravy
Kurz: ČNB 2026-05-11
```

### 8.1 Aktuální nabídky

Tabulka:

| Země | Zdroj | Lokální cena | CZK | Dostupnost | Delta | Odkaz | Kvalita |
|---|---|---:|---:|---|---:|---|---|
| DE | Lidl | 89,99 € | 2 190 Kč | online | nejlepší | otevřít | OK |
| CZ | Lidl | 2 699 Kč | 2 699 Kč | online | +509 Kč | otevřít | OK |
| HU | Lidl | — | — | není online | — | otevřít | monitor-only |

### 8.2 Historie

Zobrazit graf nebo tabulku posledních 30 dní.

Minimální požadavek fáze 1:

- tabulka historie;
- později graf.

Doporučené údaje:

- datum;
- nejlepší cena CZK;
- nejlepší země/zdroj;
- počet dostupných nabídek;
- kurzové datum.

### 8.3 Matching debug

Pro osobní použití je užitečné zobrazit:

- `match_method`;
- `match_confidence`;
- evidence, například `model code exact`, `bundle exact`, `capacity 12Ah found`;
- flags.

Ve veřejné fázi 3 může být debug zjednodušený.

## 9. Run status panel

Panel nahoře:

```text
Poslední sběr: 2026-05-11 06:30 Europe/Prague
Stav: partial success
Zdroje: Lidl CZ OK, Lidl SK OK, Lidl PL chyba parseru, Lidl HU not online, Lidl AT OK, Lidl DE OK
Kurz ČNB: 2026-05-11
Historie: 30 dní
Porovnání: cena produktu bez dopravy
```

## 10. CSV export

CSV musí být dostupné z UI a obsahovat minimálně:

- canonical variant id;
- produkt;
- model;
- bundle;
- best country;
- best source;
- best price CZK;
- pro každou zemi/zdroj lokální cenu, měnu, CZK cenu, status, URL;
- timestamp.

## 11. Responzivita

Na desktopu:

- široká tabulka;
- sticky první sloupec;
- sticky header;
- horizontální scroll.

Na mobilu:

- buď horizontální scroll;
- nebo card layout pro každý produkt;
- buňky jako compact country cards.

Minimální fáze 1:

- tabulka nesmí rozbít layout;
- horizontální scroll je přijatelný.

## 12. Texty a disclaimery

Web musí jasně uvádět:

- ceny jsou orientační;
- ceny byly ověřené v konkrétní čas;
- cena je bez dopravy;
- přepočet je podle ČNB;
- zahrnuty jsou jen online dostupné produkty;
- Kaufland v MVP jen direct-only, bez externích marketplace prodejců.

Doporučený text:

```text
Ceny jsou informativní a mohou se změnit. Porovnání používá produktovou cenu bez dopravy a přepočet do CZK kurzem ČNB z uvedeného data. Do nejlepší ceny vstupují pouze produkty dostupné k online nákupu a ověřeně spárované varianty.
```

## 13. Accessibility

- Tabulka musí být čitelná bez barev.
- Tooltipy nesmí být jediný zdroj kritické informace.
- Odkazy na zdroje musí mít textový label.
- Kontrast zvýraznění musí být dostatečný.
- Loading a error stavy musí mít text.

## 14. Frontend acceptance checklist

- [ ] Hlavní tabulka zobrazí 6 seed produktů ve fázi 1.
- [ ] Každá buňka zobrazí lokální cenu a CZK cenu.
- [ ] Nejlepší cena je zvýrazněná.
- [ ] Nedostupné/neonline nabídky nejsou zvýrazněné jako nejlepší.
- [ ] Je vidět datum posledního sběru.
- [ ] Je vidět datum kurzu ČNB.
- [ ] Lze otevřít zdrojovou URL.
- [ ] Lze stáhnout CSV.
- [ ] Detail produktu ukáže historii nebo alespoň historickou tabulku.
- [ ] Warningy u nejistého párování jsou viditelné.


---

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


---

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


---

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


---

