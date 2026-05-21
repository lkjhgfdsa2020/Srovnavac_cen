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
