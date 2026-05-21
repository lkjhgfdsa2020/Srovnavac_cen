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
