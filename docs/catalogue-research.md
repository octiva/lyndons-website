# Public catalogue collection — 21 September 2026

## Actual coverage

| Measure | Result |
| --- | ---: |
| Product sitemaps processed | 21 |
| Public product pages discovered / collected | 2,061 / 2,061 |
| Product / variant rows | 3,853 |
| Original category groups | 18 |
| Pages with descriptions | 1,889 |
| Pages without descriptions | 172 |
| Pages with product photos | 1,967 |
| Pages without product photos | 94 |
| Downloaded image references / unique image files | 2,134 / 2,063 |
| Failed page or image downloads in main import | 0 |
| Pages with no listed brand | 562 |
| Verified reachable supplier resource entries | 28 |
| Product pages linked to those brand-level resources | 976 |

These are **all product URLs found in the current public product sitemaps**, not all products stocked by Lyndons. The source website says it stocks over 10,000 products and not all are online. The distinction between pages, variants and images matters: 94 pages without photos correspond to 161 variant rows without photos.

## Downloaded Lyndons PDFs — correction to the initial research

1. [Lyndons November 2022 PDF](../public/catalogues/lyndons-product-catalogue-november-2022.pdf), 4 pages, approximately 1.6MB. Original source: https://lyndons.com.au/asset/download/914/d718a2/lyndons-catalogue-nov-22-final.pdf. **Its filename says catalogue, but opening the actual PDF reveals an offers flyer for 1–30 November 2022.** It is not a full-range catalogue. Prices are expired and must not be imported into the storefront. The earlier description of this PDF as a broader/full-range reference was incorrect and has been corrected in the site.
2. [Lyndons capability statement](../public/catalogues/lyndons-capability-statement.pdf), 20 pages, approximately 4.7MB. Original source: https://lyndons.com.au/asset/download/968/ef5a9a/lyndons-capability-statement-compressed.pdf. A company overview, not SKU inventory. Scanned pages provide no extracted text; publication date is not independently verified.
3. [Flextool product catalogue v33](../public/catalogues/flextool-product-catalogue-v33.pdf), approximately 27MB. Original supplier link: https://www.flextool.com.au/media/efmn05pp/flextool-product-catalogue-v33-spread.pdf. A supplier catalogue, not evidence that every item is stocked by Lyndons.

PDF signatures, byte sizes and SHA-256 checksums are in [download manifest](../research/download-manifest.json). **No complete current Lyndons product PDF was verified** through the website, catalogue searches or available archive evidence. This does not establish that none exists privately.

The RAPIDTOOL catalogue landing page is accessible, but its linked 2026 PDF returned HTTP 403. That download was not bypassed; the restriction is recorded in the manifest.

## Deliverables

- [Collected product spreadsheet](../public/data/lyndons-public-product-list.csv): 3,853 rows with source descriptions, codes, size/colour variants, categories, original photo URLs, supplier libraries and uncertainty notes. Excel-compatible UTF-8 BOM; spreadsheet formula-leading characters are neutralised.
- [Coverage report](../public/data/catalogue-coverage.json).
- [Supplier resources](../public/data/supplier-resources.json) and [HTTP verification audit](../research/supplier-audit.json).
- [Source sitemap discovery](../research/catalogue/discovery.json) and [import report](../research/catalogue/report.json).
- [Published product dataset](../src/data/generated/products.json); downloaded images are under the public product-image directory and included in the repository.
- Local raw records, images and combined JSON/CSV are also retained under the research catalogue directory (ignored to avoid duplicating public assets in Git).

## How the import works

The collector checks the public robots policy, discovers 21 product sitemaps, uses three workers (maximum four), and stops on HTTP 403/429. It explicitly requests HTML: requests without the correct Accept header sometimes return only a cart fragment. It does not store raw HTML or customer/session tokens.

DOM extraction preserves the visible title, listed brand, description, breadcrumbs, gallery photo sources, variant labels and their exact product references. Generic placeholders are excluded from product photos. Missing data is flagged rather than guessed. The source's concatenated invalid Product JSON for variants is not trusted; variant dropdown IDs are matched against their labelled SKU elements.

`npm run catalogue:collect` resumes from per-page records and existing photos. Records refresh when their sitemap modification value changes or a seven-day TTL expires, or with `-- --refresh`; `CATALOGUE_TTL_DAYS` configures the TTL. Failed refreshes retain the old record and are reported explicitly. Limited, incomplete and stopped collections do not overwrite the last complete product JSON/CSV/report. The separate attempt report records these outcomes. The refresh/publication policy is tested offline; this iteration did not recrawl all source pages.

`npm run catalogue:prepare` verifies supplier resources, publishes local photos and prepares both the full review dataset and losslessly compacted runtime dataset. It retains family identity, exact variant labels and source category hierarchy. `node scripts/catalogue-manifest.mjs` validates PDFs and exports the public spreadsheet. Ordering units still require verified source/business data; bag weights and colour labels are not converted into assumed purchasing units.

## Manufacturer and description confidence

The collected descriptions are **as listed by Lyndons**, not 3,853 independently rewritten/current manufacturer descriptions. Thirteen previously curated products keep their reviewed wording. The remaining rows are explicitly labelled imported and require branch confirmation.

The 28 supplier entries were reviewed against official websites, with HTTP responses recorded. This links 976 product pages to relevant **brand-level** libraries. It does **not** verify the manufacturer, current datasheet or correct modern replacement for every individual SKU. No company ownership facts are inferred from a matching domain or image filename.

Examples of rejected or unresolved matches:
- **NRG Building:** an unrelated similarly named builder's domain is not evidence. Do not map to Rockcote solely because the source image filename says Rockcote.
- **Ezycoat:** the similarly named pet-grooming domain is unrelated. The building-materials brand is linked through the official Ezycoat redirect to Active Building Systems.
- **BASF / Master Builders Solutions:** old corporate relationships and product renames were not accepted from unverified research. Legacy products remain unmapped until exact manufacturer documentation is checked.
- **Mapei / Marshalltown:** automated source requests encountered access restrictions; they were not bypassed and not counted among the verified supplier resources.
- **BESS2021:** no source manufacturer; a filename does not establish ABG, Boral, Lutum or another supplier.
- **PROMAC SDS MAX crosshead:** source description says SDS Plus while the title says MAX. The conflict is prominently flagged. Dimensions/labels are retained exactly; no speculative corrections.
- **SGE626:** source title says 600mm but description says 626mm; caveat retained.
- **Lanotec heavy duty:** actual source SKU now verified as LUBR144; older saved cart ID stays compatible while generated quote references use the true SKU.
- **PolyGlow:** six distinct colour codes now available. The old generic preview item is removed with a saved-cart warning; no colour is silently assigned.

## Images and rights

2,063 original listing images are downloaded and self-hosted, with original URLs retained. They are not certified as new/current manufacturer pack shots. All rights remain with Lyndons and the relevant owners; obtain approval before broader commercial use. No arbitrary web photo was substituted for an unknown product. Missing photos have a visible fallback.

## Completing what is not public

Request the approved ERP/POS product export with SKU, supplier code, barcode, units/pack conversion, variant, discontinued status and branch range. Match each supplier code to a current manufacturer product page, approved photo and TDS/SDS. Review the missing-brand/photo/description queue with branch staff. Do not publish private prices or treat a supplier catalogue as Lyndons inventory. The current collection is source material, not a guarantee of current availability or suitability.