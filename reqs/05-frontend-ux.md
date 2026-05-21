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
