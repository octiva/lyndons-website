# Lyndons — trade catalogue & quote preview

A simple, responsive React + TypeScript storefront for builders. No payment processing.

## Preview

- Website: https://octiva.github.io/lyndons-website/
- Repository: https://github.com/octiva/lyndons-website
- The preview password was supplied separately. This is a **client-side demo screen, not access control**. Anyone can bypass it or read the public repository/assets. No private pricing, credentials or customer records belong here.
- `noindex` and robots directives discourage indexing; they do not protect content.

## What works

- 14 source-tracked products: rewritten descriptions, photos, product references, pack sizes and supplier links where identified.
- Product/brand/code search, category/brand filters, A–Z sorting and accessible detail dialogs.
- Saved quote basket with quantities; remembered branch; 12 verified sales-branch contacts.
- Three steps: basket → contact/job details → review, download, copy or email draft.
- Pickup/delivery, preferred date, trade account and requests for unlisted products.
- Email drafting for all branches. **The customer must press Send in their email app.** Large requests require attaching the downloaded file. Download/copy remain available without an email app.
- No payment, live stock claim, order confirmation or automatic CRM submission.

## Development

Use Node 22 (see [.nvmrc](.nvmrc)). Install with `npm ci`, then `npm run dev`. The base path is `/lyndons-website/`.

- `npm run build` — TypeScript and production build.
- `npm run lint` — Oxlint checks.
- `npx playwright install chromium` — browser installation for testing.
- `npm test` — desktop/mobile Playwright tests, including axe accessibility checks.
- VS Code task **Preview Lyndons website** serves the build at http://127.0.0.1:4319/lyndons-website/ (build first).

GitHub Actions builds, lints and tests before publishing `dist`. Pages uses **GitHub Actions** as its source. No API keys are needed. Hash-based navigation works on project Pages without SPA rewrites.

## Data and privacy

Only product IDs, quantities and branch preference use localStorage. Contact/job details stay in React memory; they survive browsing in the same session but clear on refresh or unlocking a new preview session. Nothing is automatically sent to a server or analytics service. Product photos load from Lyndons’ CDN, which receives normal image requests. Downloaded files and email drafts contain the entered details.

## Scope and handover

This is a **reviewable prototype**, not a complete 10,000+ product catalogue or production quote system. The November 2022 PDF is the broader public range reference found, not a current stock list. Unclear manufacturer/packaging details are documented rather than invented.

- [Catalogue research and image provenance](docs/catalogue-research.md)
- [CRM recommendation and integration plan](docs/crm-and-integration.md)
- [Builder → reviewer → judge record](docs/review.md)

Before production: obtain the approved current SKU export, confirm source discrepancies and image rights, connect a secure quote API and CRM, implement real identity and server-side customer pricing, and test with branch staff/builders. Keep payments out of scope.