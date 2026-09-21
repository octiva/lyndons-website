# Builder → reviewer → judge

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