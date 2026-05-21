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
