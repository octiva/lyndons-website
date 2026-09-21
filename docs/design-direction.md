# Lyndons redesign direction — 22 September 2026

Status: researched proposal, not an implemented redesign. Existing quote-validation work is preserved and not deployed by this review.

## Brief

The user rejects the current generic/AI-looking theme and long one-page layout. Replace the marketing-led landing page with a familiar, practical trade-supplies website. Products and downloadable catalogues belong on separate pages. Keep the quote basket available globally; do not embed the checkout or a long quoting explainer at the bottom of the homepage.

Retain: existing Lyndons identity, source-tracked product data, exact SKU variants, responsive behaviour and quote-only operation. Do not introduce payment processing or invent prices/stock/manufacturers.

## Competitor review: observed, not assumed

Reviewed public pages in an ordinary browser, plus extracted page content. No accounts created, orders placed, forms submitted or authenticated flows tested. Some extraction calls followed advertising redirects; browser inspection supplied usable evidence instead. This is a qualitative design review, not a performance benchmark or conversion study. Patterns inform original design; competitor branding/assets/copy are not to be reproduced.

### Bunnings / Bunnings Trade

Sources:
- https://www.bunnings.com.au/
- https://trade.bunnings.com.au/
- https://www.bunnings.com.au/products/building-hardware
- https://www.bunnings.com.au/products/building-hardware/cement-concreting
- https://www.bunnings.com.au/bastion-20kg-concrete-mix_p0038287

Observed:
- Dominant header search and separate menu/account/project-list/cart controls.
- Dedicated category hierarchy: Building & Hardware → Concrete & Cementing → more specific product types.
- Listing shows result count, filters, sorting, and distinct in-store/collection/delivery choices.
- Product page exposes item number, features, specifications and Guides & Documents, with store selection for availability.
- Separate trade site offers trade services, category/brand navigation and business-oriented content.

Adopt: familiar search/category/product structure; clear product codes; specification/document hierarchy; persistent branch context; list-building.

Do not copy: green/red branding, rewards/finance, sponsored panels, large DIY editorial feed or unverified availability promises. Bunnings itself has long promotional pages: multi-page architecture does not require copying its homepage length.

### Blackwoods

Sources:
- https://www.blackwoods.com.au/
- https://www.blackwoods.com.au/catalogues (observed navigation destination; document download flow not tested)
- Observed navigation also links /c/categories, /b/brands, /branches and /help.

Observed:
- Distinct Categories, Brands, Promotions, Catalogue, Help and Our Branches navigation.
- Header search, Track Order and My Account controls.
- Explicit login/register prompt to view price and availability.
- Featured industrial products with product-specific links.

Adopt: straightforward industrial vocabulary and dedicated catalogue/branch destinations. Future customer pricing belongs behind real authentication.

Do not copy: compulsory login for Lyndons' public browsing/quote preparation, account controls with no actual service behind them, promotional carousel density or industrial-portal complexity.

### Total Tools

Source: https://www.totaltools.com.au/

Observed:
- Prominent Find your tools search; dedicated store locator and cart destinations.
- Shop by category plus trade-focused category shortcuts; separate brand destinations and a View All Brands link.
- Dedicated catalogue offers / on-sale catalogue links, delivery information and order tracking.
- Multiple promotion banners and visible sign-in/chat overlays during review.

Adopt: fast brand/category access, identifiable product imagery and a familiar product-search header.

Do not copy: red/blue brand treatment, rewards/redemptions/gift cards, competing sales messages or multiple overlays.

### Mitre 10

Source: https://www.mitre10.com.au/

Observed:
- Find your closest store and View All Stores in header.
- Separate Shopping list, Trade Centre and catalogue destinations.
- Product categories include Masonry & Wet Trade Tools.

Adopt: clear local-store ownership and shopping-list language, with trade-relevant category names.

Do not assume: the behaviour behind signed-in lists or order/stock integration; these were not tested.

## Why the existing design feels generic

- Oversized split hero with abstract slogans ahead of the useful content.
- Repeated eyebrow label → large heading → three/four similar cards.
- Decorative icon tiles instead of immediately recognisable material/tool photographs.
- Long homepage contains product search, all results, quoting explanation, resource cards and branch content.
- Product details are modal-only, so products cannot be naturally bookmarked/shared as pages.
- Similar visual weight for practical actions and secondary marketing content.

The problem is hierarchy and repetition, not simply rounded corners or the burgundy colour.

## Three original design directions

### A. Trade Counter — recommended

An established supplier's storefront: white background, Lyndons maroon header/navigation accents, charcoal text and neutral dividers. Use maroon for primary actions rather than huge full-page colour blocks. Remove the invented gold accent unless confirmed as part of approved branding.

Logo, large rectangular search, branch and Your quote in the header. Plain horizontal navigation. Compact category photographs, descriptive headings and restrained spacing. No animated hero carousel. Short homepage with one real branch/yard photograph and a useful category directory.

Best for: mixed experience levels, builders on phones, repeat trade customers. Recommended starting point.

### B. Supply Desk

More utilitarian: compact product rows, visible SKU/size/unit columns, multi-line quantity entry and fewer photographs in results. Search and Quick add lead; homepage resembles a supply index, not a campaign page.

Best for: experienced repeat purchasers and office estimators. Offer its list-view/quick-add features within A rather than making every first-time visitor use a dense table.

### C. Local Branch

More personal: approved photos of actual Lyndons branches, team and vehicles; location-led homepage and clear phone/directions. Less product density on home, with category links leading immediately to the full product pages.

Best for: local relationships and first-time customers. Use authentic branch content within A, not another long story-led landing page. Staff names/hours/photos need approval and maintenance.

## Proposed multi-page architecture

Global header: logo → product search → selected branch → Your quote (count).

Primary navigation: Products | Brands | Catalogues & data sheets | Branches | Delivery & help.

| Page | Primary content | Keep off this page |
| --- | --- | --- |
| Home | Search, short factual intro, 6–8 photo category links, local-branch shortcut, optional recently viewed products | Full catalogue, quote form, PDF library, repeated benefit blocks |
| Products | Category directory and/or results; breadcrumbs; filters; sorting; grid/list choice | Hero campaign, general company story |
| Category/subcategory | Relevant products and meaningful specification filters | Unrelated product groups |
| Product | Own shareable URL; photos, brand/reference, size/colour, quantity, quote action, specifications, exact source documents | Large unrelated promotional blocks |
| Brands | A–Z of actually listed brands; links to filtered range | Claim all brands have verified manufacturers |
| Catalogues & data sheets | Searchable document rows with supplier, type, date/version, size, View and Download | Expired offer prices presented as current |
| Branches / branch detail | List first; phone, email, address/directions; approved current hours and services | Forced location permission or mandatory interactive map |
| Delivery & help | Pickup/delivery enquiry process, site-access requirements, quote FAQs | Guaranteed charges/timing without branch data |
| Your quote | Editable line list → contact/job details → review/share | Marketing panels or payment fields |

Products and PDF catalogues are separate concepts. Use “Products” for shopping; “Catalogues & data sheets” for documents.

### Quote access

Keep the tested quote flow, but make it its own page. A small drawer can provide a quick preview from any page: last added item, quantities, View quote and Continue browsing. The complete form does not belong at the bottom of Home. Do not force-open the drawer after every add.

### Navigation requirements

- Real link semantics, open-in-new-tab support and URLs identifying product/category/page/filter state.
- Browser Back restores filters and position; copied product links resolve to the correct family/SKU.
- Route headings receive appropriate focus; title and current-navigation state update.
- For the GitHub Pages preview, hash routes such as `#/products` and `#/product/CMNT039` provide distinct page views without a server rewrite. For public SEO, prerender real product/category paths or move to hosting that supports them. Do not claim hash routes alone solve SEO.
- Old #products/#quote/#resources links should map to the new destinations.

## Page composition

### Home (short)

1. Persistent search/navigation.
2. Compact introduction: “Building and construction supplies”, one actual approved yard/branch photo and Browse products.
3. Six to eight product-photo category links; View all categories.
4. Small practical strip: chosen branch / phone / collection and delivery information.
5. Compact footer. No full quote form or document library below it.

### Listing

Breadcrumb → category name and result count → subcategory links → filters + results. Desktop sidebar, mobile Filters button opening an accessible panel. Clear applied-filter chips. Cards carry photo, name, code/variant summary, verified pack information, quantity/choose-options and Add to quote. Dense list view optional for desktop.

### Product

Desktop: image left, product identity and quote controls right. Mobile: name/reference, image, size/colour, quantity, action, then specifications/documents. Show factual uncertainties near the affected field; avoid replacing all useful detail with repeated general warnings. Source safety/specification conflicts must stay visible before quoting. Quick view optional, never the only route.

### Documents

Use a document list rather than marketing cards. Separate current supplier catalogues, TDS/SDS, company documents and archived offers. The four-page November 2022 flyer belongs under Archived offers with an expired warning. Do not label the capability statement a product catalogue.

## Feature ideas: ordered by utility

### First redesign release

- Shareable product/category URLs and correct Back behaviour.
- Saved product-only lists on this device, with clear clear/reset controls. No site addresses/customer names in browser storage.
- Quick add by known product code and quantity; unresolved codes require confirmation, never fuzzy auto-add.
- Grid/list switch, source-backed subcategories, consistent branch controls.
- Product document links and visible ordering units where confirmed.
- Can't find it? An unlisted-item request entry available even with an otherwise empty basket; branch confirmation required.
- Quote preview drawer plus a separate quote page.

### Later, with data/service prerequisites

- Bulk paste/import of item codes, validated preview before adding.
- Compare 2–3 tools using verified comparable specifications, not marketing descriptions.
- Quantity calculators only with validated coverage/yield rules, units and wastage assumptions; never structural advice or automatic substitutions.
- Photo/plan attachment for branch enquiries once secure upload, malware handling, size limits and retention exist. Until then, explicit email attachment instructions.
- Real submitted quote tracking, staff assignment, account-based repeat orders and customer-specific pricing after backend/auth/CRM integration.
- Branch availability or delivery estimates only after trusted source integration. No guessed stock badges, delivery times or quantities.

### Deliberately omit

AI shopping assistant, fake reviews, loyalty points, countdown offers, payments/finance, mandatory account registration for quote preparation, broad DIY magazine content, and automatic incompatible-product substitutions.

## Delivery plan

1. Produce desktop/mobile Home, listing and product mockups in Direction A, with one alternative visual direction for comparison. Validate the visual direction before rebuilding every screen.
2. Introduce page routing/shared header/footer and move existing products/resources/branches into their own page views. Keep working quote data/logic.
3. Replace modal-only product journey with dedicated detail pages and restore state on Back.
4. Add the highest-utility list/quick-add features without expanding backend scope.
5. Builder → reviewer → judge pass: find a specified product, choose correct size, add three quantities, return to listing, locate data sheet, change branch and prepare quote on mobile and desktop. Continue existing Chromium/WebKit and privacy tests.

Acceptance: Home is a gateway, not the entire site; every core task has a direct destination; no marketing content is required to reach product results/quote controls; visual identity is recognisably Lyndons, not a copied competitor skin. Source uncertainty and static-preview limitations remain honest.