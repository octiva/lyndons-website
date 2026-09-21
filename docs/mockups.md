# Clickable design mockups

Open the mockup entry at `/lyndons-website/mockups/` on the preview server or published Pages site. Preview password remains the supplied password. This is a separate static prototype, not a replacement for the React storefront.

Direct concept links: `mockups/?concept=counter#/home` and `mockups/?concept=desk#/home`. The switch preserves the page so Home, listing and product layouts can be compared like-for-like. A reload requests the preview password again.

## Directions

- **A — Trade Counter:** short photographic homepage, traditional maroon product navigation, clean grid listing, dedicated detail page. Recommended baseline.
- **B — Supply Desk:** compact directory homepage, exact-code quick add, neutral navigation and dense product rows. Switch direction in the review bar on any page to compare the same content.

Both directions have responsive Home, Products, Product, Brands, Catalogues, Branches, Help and Quote views. Hash routes are distinct page views, not anchors in one long homepage. Browser Back/Forward works for route/filter changes. The mockup does not promise production-level scroll restoration.

## Interactive scope

- Eight real catalogue samples and their downloaded photos; search, category/brand/type filters and sorting.
- Dedicated product URLs, quantities, temporary quote basket, remove/edit quantities, two sample branch choices.
- Concept B exact-code quick add supports sample SKUs only.
- Real downloaded document links with the November 2022 expired-offer warning.
- No customer detail form, backend, prices, stock status, account system or sending. Basket is held in memory only, isolated from the live preview. Refresh clears it; nothing transfers to the existing quote flow.
- No fake stock, savings, recommendations or sales rankings. Product photo/description provenance remains the existing catalogue. The sitework image comes from the existing Lyndons website; no claim it shows a particular branch.
- The client-side preview lock is a convenience, not security.

## Review tasks

1. Compare the two Home pages at desktop and phone sizes.
2. Browse Concrete & cement, choose a product, open its dedicated details page.
3. Add quantity 3 and visit Your quote from the header.
4. Visit Catalogues: the list is its own page and never appears at the bottom of Home.
5. Switch to Supply Desk and try exact code CMNT039.

Decide layout and visual direction before migrating the production catalogue/quote components. Keep existing uncommitted contact-validation work separate from mockup commits/deployment.