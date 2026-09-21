# Catalogue research & provenance

Research date: 21 September 2026. A curated 14-product preview, not a complete inventory.

## Broader catalogue found

[Lyndons product catalogue, November 2022 (PDF)](https://lyndons.com.au/asset/download/914/d718a2/lyndons-catalogue-nov-22-final.pdf). Verified HTTP 200 / application/pdf; server last-modified 9 November 2022. Explicitly labelled archived in the UI. No newer complete public catalogue was verified. The [existing directory](https://lyndons.com.au/products) states that the company stocks over 10,000 products and that not all stocked products appear online. Neither a PDF nor an online listing proves present-day branch stock.

## Supplier resources verified

- [Sunstate products](https://sunstatecement.com.au/our-products/) and [technical data](https://sunstatecement.com.au/publications/product-data/). Manufacturer site links OneMix.
- [Sika Australia](https://aus.sika.com/). The exact 212 HP listing is sourced from Lyndons; no guessed manufacturer product URL is published.
- [A.G. Pulie range](https://www.agpulie.com.au/products/category) and [download library](https://www.agpulie.com.au/DOWNLOADS): MasterFinish and supplier catalogues.
- [Concrete Colour Systems technical library](https://concretecoloursystems.com.au/data-sheets-guidelines).
- [Topcon Positioning](https://www.topconpositioning.com/): kit contents must be confirmed with Lyndons.
- [Supa Coat PM605B technical sheet](https://supacoat.com.au/wp-content/uploads/2023/07/TDS-PM605B-Pool-Basecoat-Render.pdf).
- [Husqvarna Construction](https://www.husqvarnaconstruction.com/au/), [Lanotec](https://lanotec.com.au/), [Easy Mix](https://www.easymixsales.com.au/), [Schneppa Glass](https://schnepparecycledcrushedglass.com.au/).

All published supplier/resource URLs and all 14 photo URLs returned HTTP 200 in the link audit. Reachability does not establish product equivalence, stock or image rights.

## Product records and unresolved gaps

[Structured catalogue](../src/data/catalog.ts) stores original listing URL, image URL, manufacturer/brand attribution, pack, rewritten description and checked date. No inferred price or availability is displayed.

- **BESS2021:** no manufacturer on the source page. An ABG image filename and Besser-style code do not establish a manufacturer. Displayed as manufacturer to confirm.
- **NRG14547:** listed as NRG / light base, but image filename says Rockcote / deep base. Shown with explicit detail-page caveat. Get current approved image and exact manufacturer/base before production.
- **SGE626:** sold as 600mm; description specifies 626 × 58mm blade. Difference is disclosed.
- **LANOTEC-400 and POLYGLOW-1KG:** internal preview IDs, not verified supplier SKUs. Ask the branch to confirm current ordering codes and pack.
- **Bowser & Lever:** listed brand verified; underlying manufacturer not independently established. Do not silently relabel.
- **Husqvarna blade / Topcon kit:** no invented RPM, bore, accuracy, compatibility or kit inclusions.

## Photography and rights

Product photos are existing Lyndons listing images linked at their original URLs, **not newly commissioned or independently licensed manufacturer images**. Logo variants and hero photo were copied from the existing site. Ownership remains with the respective owners. Obtain Lyndons/supplier approval before broader commercial launch and replace outdated/ambiguous pack shots. Current manufacturer photography cannot be certified for every legacy SKU without supplier-code mapping. Failed photos have a visible fallback. Fonts are self-hosted Fontsource packages under their bundled open font licences.

## Branch data

12 customer-facing branches, excluding head office and Carole Park steel-only no-sales location. Phones and public branch emails were checked against each original location page. No individual staff emails are used. Maroochydore is **maroochy@lyndons.com.au**, not an email derived from the town spelling. Addresses/hours link to source pages to avoid copying stale schedules.

## Completing the catalogue

1. Get current ERP/POS export: SKU, supplier code, barcode, category, units, pack conversion, discontinued status, branch range and supplier ID. Keep customer prices out of public files.
2. Reconcile against the archived PDF and supplier catalogues; do not label a supplier’s whole range as Lyndons stock.
3. Match supplier codes to approved photos and current technical/safety sheets. Record permission/date and queue ambiguous matches for staff.
4. Import top-selling products first with duplicate, variant and pack checks, then expand categories/search synonyms.
5. Branch-manager approval per batch. Maintain via CMS/PIM or ERP feed; use paginated search for the full range.