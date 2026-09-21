# CRM and production integration

## Recommendation

**Zoho CRM Free: suitable for a small three-person pilot.** Hosted, so less infrastructure for a low-tech team. The [official plan page](https://www.zoho.com/crm/free-crm.html), checked 21 September 2026, lists up to 3 users, 5,000 records across modules and 1GB file storage. A 12-branch company will probably need a paid plan. Verify current API, automation, permissions and routing entitlements before committing; do not assume every integration is included free.

**Frappe CRM: evaluate for company-wide use.** [Frappe CRM](https://frappe.io/crm) is open source and avoids per-user licensing. Software can be self-hosted free, but hosting, backups, security patches, email and implementation cost money. Managed hosting is paid (the official site advertises compute-based plans from US$5/month; confirm appropriate capacity and pricing). Use an IT provider, not branch staff, to run it.

No CRM account was created and no customer data was sent to a provider. HubSpot is another candidate, but current free-tier limits were not reliably verified here; it is not presented as unlimited free CRM.

## Branch workflow

New request → Assigned to branch → Preparing quote → Quote sent → Accepted / Declined.

One contact/company and one deal per job, with an immutable copy of line items and units. Assign by branch, flag unlisted products, follow up outstanding quotes. Keep the ERP authoritative for prices, terms, stock and fulfilment; CRM is not the pricing engine.

## Phase 1: real quote submission

The Pages preview prepares a download/email draft. A genuine “Send quote request” action needs an independently hosted HTTPS API:

- `POST /quote-requests`: validate references, integer quantities, units, branch, contact fields, address and notes server-side. Add rate limits, spam protection, idempotency, size limits and a branch-email allowlist.
- Durably store, return a request ID, enqueue CRM/email. Show submitted only after server confirmation; handle retries without duplicates.
- Keep keys server-side, never in a Vite bundle. Set retention rules, origin policy, privacy notice, access roles, encryption and audit logs.
- Provider accounts and approved credentials are required. This cannot be secured solely by GitHub Pages.

## Phase 2: customer-specific pricing, still no payments

The `PricingProvider` interface in the [quote model](../src/lib/quote.ts) reserves an integration boundary. No fake prices or zero-dollar totals appear today.

- Authenticate customers and resolve account membership server-side. Never trust a typed account number or client-supplied customer ID for authorisation.
- Combine ERP price lists, customer agreements, branch, units, quantity breaks, GST and delivery fees. Return AUD, ex/inc-GST totals and expiry/version.
- Reprice on submission, snapshot terms, retain staff approval where required. Cache only per authorised customer; no public price bundle.
- Keep quote/PO and trade-account workflows. No cards or payment gateway.

## Secure preview hosting

Pages is publicly readable. The themed lock is a convenience, not authentication. For confidential access, use server-enforced identity (for example Cloudflare Access on a supported hosting arrangement). A JavaScript password hash does not secure public static files.