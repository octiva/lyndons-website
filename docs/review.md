# Builder → reviewer → judge

## Trade Counter migration — 22 September 2026

Implemented the approved visual direction in the main React storefront, not just the standalone mockups. Separate destinations cover browsing, categories, brands, exact-SKU detail, documents, branches, help and quote. All 2,061 families / 3,853 options remain available with URL-backed filters, pagination, legacy links, focus and history handling.

Homepage order follows the revised brief: banner search, rotating factual updates/resources, then product tiles. The latest requested second search appears near Browse products and stays synchronized with the banner. Detail/documents/quote pages retain only the header search. The favicon preserves 55 paths from the actual Lyndons wheelbarrow figure, excluding the lettering.

Contact validation rejects blank-only names/addresses, normalizes optional whitespace, checks plausible phone syntax and rechecks the local date on submission. No identity verification, automatic submission, payment or secure preview authentication is implied. Existing product-only persistence, shared branch, quantity validation and manual attachment handoff remain.

Validation: **195 Playwright cases** across desktop Chromium, mobile Chromium and mobile WebKit, plus **14 Node tests**, TypeScript/build, lint, production dependency audit (zero vulnerabilities), editor diagnostics and diff checks passed. Desktop/mobile screenshots confirm the requested composition and second search. Independent read-only review found no public-preview blockers and independently checked catalogue counts, favicon geometry, search synchronization, nine destinations, axe and 320–1440px overflow. WebKit emulation is not physical-device testing. No customer email was sent.

The existing large static-data chunk advisory remains; pagination limits rendered cards, not the downloaded dataset. Backend submission, authenticated pricing, current inventory approval, manufacturer/pack verification and image permissions are still production prerequisites. The older entries below describe previous releases, not the new page structure.

## Usability iteration — 21 September 2026

- Reproduced and fixed header/quote branch divergence; one state now controls selection, summary and email recipient.
- Reusable quantity editing permits blank drafts, reports integer/range errors and blocks progressing with invalid quantities. True source codes display in the cart.
- Long email handoff explicitly requires a downloaded file plus acknowledgment; readiness resets on quote edits. No automatic sending or attachment claim.
- 2,061 family cards retain all 3,853 SKUs. Multi-option cards open an unselected size/colour selector; exact SKU searches alone preselect an option. Source photos are identified as shared listing images. Quote actions are above long product descriptions on mobile.
- Restored source subcategories, consistent category/brand resets, trade synonyms, labelled typo suggestions and exact-SKU ranking.
- Unified preview-gate state fixes double unlock when session storage is blocked. Locking destroys contact state after confirmation; product basket remains saved. Browser unload warnings are best-effort and exempt download events so Safari downloads remain usable.
- Catalogue refresh policy compares sitemap lastModified and a configurable seven-day TTL. Limited/stopped/failed runs cannot replace last-complete product exports. Policy tests are offline; no claim of a fresh complete recrawl.
- Lossless string-table compaction reduces this iteration's uncompressed storefront chunk from ~4.76MB to ~1.91MB. Gzipped chunk decreases from ~557KB to ~530KB; this is not a 60% network saving. Still deferred until unlock; server-side/on-demand data remains future work.

Read-only independent review found no blocking implementation issue; its “production-ready” conclusion was not accepted because real submission, pricing/authentication and catalogue sign-off remain outstanding. Conditional same-component state reconciliation in QuantityInput is guarded and tested; replacing it with an effect was not necessary.

Validation: 81 cases across desktop Chromium, mobile Chromium and mobile WebKit plus 14 Node tests pass. Safari quote tests were also repeated twice (20 passes) after fixing a download/unload-warning interaction. TypeScript, lint, production audit and editor diagnostics are clean. WebKit emulation is not physical-device validation. No customer message was sent.

### Remaining work requiring approved data or services

Verified purchasing units/pack conversions, manufacturer/SKU matching and image permissions; staff-managed data review; secure quote API and CRM credentials; authenticated customer-specific pricing. No payments. Keep the simple design; do not fabricate these integrations or data to claim completeness.

## Catalogue expansion pass — 21 September 2026

Parallel research covered catalogue discovery, tools, chemicals/materials and hardware/safety supplier resources. A reproducible collector processed all 2,061 public sitemap listings into 3,853 product/variant rows and downloaded 2,063 unique images. Exact manufacturer matching is incomplete and is not claimed.

Opening the actual four-page November 2022 PDF corrected the earlier mistaken assumption that it was a broad product catalogue: it is an expired promotional flyer. Site labels, README and research documentation now make this explicit. Two further PDFs were downloaded (20-page capability statement and Flextool v33 catalogue); the RAPIDTOOL PDF denied access and was not bypassed.

Builder changes: all-category selector, 24-item pagination, deferred catalogue loading until unlock, source provenance, local product photos and downloadable CSV. SKU-based reconciliation preserves moved Sika listings and all six PolyGlow colours. The old generic PolyGlow basket item is removed with a warning rather than arbitrarily choosing a colour.

Independent read-only reviewer and judge found no preview-release blockers. Their output was checked against executable evidence: **3 extractor tests and 22 desktop/mobile Playwright cases passed**, TypeScript build and Oxlint passed, production audit reported zero vulnerabilities. Browser visual review confirmed mobile imported-variant search, photo and caution label.

The complete catalogue is approximately 469KB gzipped and deferred until unlock. Vite reports a large-chunk advisory (approximately 3.8MB uncompressed); pagination limits rendered cards, not the dataset size. For slower networks or further growth, replace the static data with server-side search/paginated API. This is documented rather than hidden by changing the warning threshold.

The earlier sections below describe the original 14-product preview and its first deployment, not the current catalogue coverage.

### Expanded release verification

[Workflow 35596388696](https://github.com/octiva/lyndons-website/actions/runs/35596388696) successfully built, tested and deployed commit `3a8ef00`. Live browser verification shows 3,853 results, 24 cards per page, all 18 category choices and the nine resource cards. Live HTTP checks returned 200 with correct content types for the coverage JSON, product CSV, all three downloaded PDFs and a self-hosted product photo. The coverage JSON reports 2,061 pages / 3,853 rows / 2,063 unique photos.

## Builder pass

Built around find → add → review → share, rather than retail payment checkout. Five broad product categories, photo-led cards, plain labels, direct branch calls, no account requirement and a mobile bottom navigation. Burgundy/gold palette retains the existing Lyndons logo. Sourced 14 records and a broader archived catalogue.

## Independent reviewer pass

Read-only reviewer inspected code and flagged branch-email coverage, remembered branch preference, catalogue uncertainty, form validation and mobile clarity.

Accepted changes:
- Verified all 12 public branch email addresses and enabled direct email drafting for each (initial build only had Windsor).
- Persist branch preference separately from customer details.
- Retain customer draft in memory when returning to browse, without writing personal information to browser storage.
- Correct browser phone-pattern syntax and test invalid/required delivery forms.
- Strengthen contrast after axe found a 4.45:1 disclaimer; raised it above 4.5:1.
- Increase key product names, pack text and actions for readability.
- Use encoded email-body length for the attachment fallback and retain download/copy alternatives.

Findings checked and rejected:
- “Missing date field”: the preferred-date input already existed; verified directly.
- “Native required needs aria-required”: redundant for native inputs; kept proper labels and required attributes.
- Proposed per-category order caps: no verified business rules support arbitrary caps. Retained positive integer limits and branch confirmation instead.

## Judge pass

Separate read-only judge re-inspected revised components, data, docs and tests. Approved **public design-preview** publication, not production readiness. No new preview blockers identified. Agent review is advisory; automated/browser checks are the actual validation evidence.

## Verification

Playwright covers desktop Chromium and mobile Chromium emulation. Core suite passed 14/14 after the first fixes; the final suite, including draft retention and image fallback, passed **18/18**. TypeScript build, Oxlint and production dependency audit passed (zero reported vulnerabilities).

- Password rejection, unlock, reload and relock.
- Product-code search, category/brand filtering, no-result recovery and keyboard dismissal of dialogs.
- Quote persistence, quantities and removal.
- Required contact/delivery fields, review disclosure, Townsville email draft and downloaded quote contents.
- No customer name/email/address in localStorage.
- axe checks for gate, catalogue and checkout details (WCAG A/AA automated rules; not a full accessibility certification).
- No horizontal overflow at 320, 390, 768 and 1440px.
- Browser visual checks on desktop and mobile.
- Every published supplier/resource link and all 14 photo URLs returned HTTP 200 in the source audit.

## Deployment verification

[GitHub Actions run 35586764040](https://github.com/octiva/lyndons-website/actions/runs/35586764040) completed successfully, including the independent Linux build/test job and Pages deployment. The [live site](https://octiva.github.io/lyndons-website/) was checked in the browser: correct password unlocks, all 14 photos decode, the quote review opens, Maroochydore routes to the verified `maroochy@lyndons.com.au` address, and dummy contact data is absent from localStorage. No test email was sent.

## Production gate (not yet passed)

Approved current SKU export, manufacturer/packaging reconciliation, image permissions, full catalogue import, real quote API with delivery confirmation, CRM assignment, real customer identity/pricing and manual testing with builders and branch staff. Password screen remains explicitly non-secure on public Pages.