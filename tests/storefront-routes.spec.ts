import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { branches, catalogues, productFamilies, products } from '../src/data/catalog';
import { searchCatalogue } from '../src/lib/catalogue-search';

async function unlock(page: Page, hash = '#/home') {
  await page.goto(`./${hash}`);
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website', exact: true }).click();
  await expect(page.getByRole('main')).toBeVisible();
}

async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name, exact: true }).click();
  const closedMenu = page.getByRole('button', { name: 'Open menu', exact: true });
  if (await closedMenu.isVisible()) await expect(closedMenu).toHaveAttribute('aria-expanded', 'false');
}

async function oneSearch(page: Page) {
  await expect(page.getByRole('search', { name: 'Product search', exact: true })).toHaveCount(1);
  const listing = ['home', 'products'].includes(await page.getByRole('main').getAttribute('data-page') ?? '');
  await expect(page.locator('input[type="search"]')).toHaveCount(listing ? 2 : 1);
  await expect(page.getByRole('banner').getByRole('searchbox', { name: 'Search products or product codes', exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByRole('searchbox', { includeHidden: true })).toHaveCount(listing ? 1 : 0);
}

test('browse search stays synchronised with banner search, filters, reload and history', async ({ page }) => {
  await unlock(page);
  const banner = page.getByRole('searchbox', { name: 'Search products or product codes', exact: true });
  const range = page.getByRole('searchbox', { name: 'Search this product range', exact: true });
  await range.fill('wheelbarow');
  await expect(range).toBeFocused();
  await expect(banner).toHaveValue('wheelbarow');
  await expect(page.getByRole('status').filter({ hasText: 'No exact text match.' })).toBeVisible();
  await banner.fill('SIKA212');
  await expect(range).toHaveValue('SIKA212');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await range.press('Enter');
  await expect(page.locator('#catalogue-results')).toBeFocused();
  await expect(page).toHaveURL(/#\/home\?q=SIKA212$/);
  await banner.press('Enter');
  await expect(page).toHaveURL(/#\/products\?q=SIKA212$/);
  await page.reload();
  await expect(range).toHaveValue('SIKA212');
  await range.fill('');
  await expect(banner).toHaveValue('');
  await expect(page.locator('#catalogue-results')).toContainText('3,853 options');
});

test('favicon is the self-contained Lyndons wheelbarrow figure', async ({ page }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('site-icon.svg?v=barrow-1');
  const response = await page.request.get(href!);
  expect(response.ok()).toBe(true);
  const svg = await response.text();
  expect(svg).toContain('viewBox="-8 -15 154 154"');
  expect((svg.match(/<path\b/g) ?? []).length).toBe(55);
  expect(svg).not.toMatch(/<image|<script|href=/);
});

test('destinations are separate pages with mobile navigation, focus, history, and one header search', async ({ page }) => {
  await unlock(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your building supplies.');
  for (const [name, route, heading] of [
    ['Products', 'products', 'All products'],
    ['Categories', 'categories', 'Product categories'],
    ['Brands', 'brands', 'Brands'],
    ['Catalogues & data sheets', 'catalogues', 'Catalogues & data sheets'],
    ['Branches', 'branches', 'Your local Lyndons'],
    ['Delivery & help', 'help', 'Delivery & help'],
  ]) {
    await navigate(page, name);
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    const title = page.getByRole('heading', { level: 1, name: heading, exact: true });
    await expect(title).toBeFocused();
    await expect(page).toHaveTitle(`Lyndons — ${heading} | Building & construction supplies`);
    await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name, exact: true, includeHidden: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('region', { name: 'Updates and useful information', exact: true })).toHaveCount(0);
    await expect(page.locator('.product-card')).toHaveCount(route === 'products' ? 24 : 0);
    await oneSearch(page);
    await page.reload();
    await expect(title).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
  }
  await page.getByRole('link', { name: 'Your quote, 0 items', exact: true }).click();
  await expect(page).toHaveURL(/#\/quote$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your quote list is empty');
  await oneSearch(page);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delivery & help');
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your quote list is empty');
  await page.getByRole('link', { name: 'Lyndons home', exact: true }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your building supplies.');
  await oneSearch(page);
});

for (const [legacy, canonical, heading] of [
  ['#home', '#/home', 'Find your building supplies.'],
  ['#products', '#/products', 'All products'],
  ['#categories', '#/categories', 'Product categories'],
  ['#brands', '#/brands', 'Brands'],
  ['#resources', '#/catalogues', 'Catalogues & data sheets'],
  ['#branches', '#/branches', 'Your local Lyndons'],
  ['#how-it-works', '#/help', 'Delivery & help'],
  ['#quote', '#/quote', 'Your quote list is empty'],
]) {
  test(`legacy ${legacy} canonicalizes and survives direct reload`, async ({ page }) => {
    await unlock(page, legacy);
    await expect.poll(() => new URL(page.url()).hash).toBe(canonical);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await page.reload();
    await expect.poll(() => new URL(page.url()).hash).toBe(canonical);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.getByLabel('Preview password', { exact: true })).toHaveCount(0);
  });
}

test('full production range exposes 2,061 families and all 3,853 options, including the final page', async ({ page }) => {
  expect(products).toHaveLength(3853);
  expect(productFamilies.size).toBe(2061);
  const all = searchCatalogue('', 'All products', '', 'All brands', 'featured');
  expect(all.families).toHaveLength(2061);
  expect(all.matches.map(product => product.id).sort()).toEqual(products.map(product => product.id).sort());
  await unlock(page, '#/products');
  const results = page.getByRole('region', { name: 'Product results', exact: true });
  await expect(results.getByRole('status')).toHaveText('2,061 products · 3,853 options');
  const pagination = page.getByRole('navigation', { name: 'Catalogue pages', exact: true });
  const selector = pagination.getByRole('combobox', { name: 'Catalogue page', exact: true });
  await expect(selector.locator('option')).toHaveCount(86);
  await expect(pagination.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
  await selector.selectOption('86');
  await expect(page).toHaveURL(/#\/products\?page=86$/);
  await expect(page.locator('.product-card')).toHaveCount(21);
  await expect(page.locator('.product-card h3')).toHaveText(all.families.slice(2040).map(product => productFamilies.get(product.familyId)!.length > 1 ? product.familyName : product.name));
  await expect(pagination.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.reload();
  await expect(selector).toHaveValue('86');
  await expect(page.locator('.product-card')).toHaveCount(21);
  await expect(results.getByRole('status')).toHaveText('2,061 products · 3,853 options');
  await pagination.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(selector).toHaveValue('85');
  await expect(page.locator('.product-card')).toHaveCount(24);
  await expect(page.locator('#catalogue-results')).toBeFocused();
});

test('listing filters, sort and pagination survive reload and detail back/forward navigation', async ({ page }) => {
  const category = 'Concrete & cement';
  const subcategory = 'Cementitious Bagged Products';
  const params = new URLSearchParams({ category, subcategory, sort: 'az', page: '2' });
  const hash = `#/products?${params}`;
  const expected = searchCatalogue('', category, subcategory, 'All brands', 'az').families.slice(24, 48);
  expect(expected.length).toBeGreaterThan(0);
  await unlock(page, hash);
  async function checkListing() {
    await expect.poll(() => new URL(page.url()).hash).toBe(hash);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(category);
    await expect(page.getByRole('combobox', { name: 'Sort products', exact: true })).toHaveValue('az');
    await expect(page.getByRole('combobox', { name: 'Catalogue page', exact: true })).toHaveValue('2');
    // Hidden mobile refinements still need to be hydrated from the route.
    await expect(page.getByRole('combobox', { name: 'Narrow by product type', exact: true, includeHidden: true })).toHaveValue(subcategory);
    await expect(page.locator('.product-card h3')).toHaveText(expected.map(product => productFamilies.get(product.familyId)!.length > 1 ? product.familyName : product.name));
  }
  await checkListing();
  await page.reload();
  await checkListing();
  const card = page.locator('.product-card').first().getByRole('link', { name: /^View / });
  const detailHash = await card.getAttribute('href');
  await card.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => window.scrollY);
  await card.click();
  await expect.poll(() => new URL(page.url()).hash).toBe(detailHash);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await checkListing();
  await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - scroll)).toBeLessThanOrEqual(3);
  await page.goForward();
  await expect.poll(() => new URL(page.url()).hash).toBe(detailHash);
  await expect(page.getByRole('region', { name: 'Product selection', exact: true })).toBeVisible();
});

test('exact source-SKU deep links preselect the right variant and remain exact after refresh', async ({ page }) => {
  await unlock(page, '#/product/PG709');
  const option = page.getByRole('combobox', { name: 'Choose size / colour', exact: true });
  await expect(option).toHaveValue('PG709');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Purple Crush');
  await expect(page.getByRole('button', { name: 'Add to quote', exact: true })).toBeEnabled();
  await oneSearch(page);
  await page.reload();
  await expect(page).toHaveURL(/#\/product\/PG709$/);
  await expect(option).toHaveValue('PG709');
  await page.getByLabel('Quantity', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Add to quote', exact: true }).click();
  await page.getByRole('link', { name: 'Your quote, 2 items', exact: true }).click();
  await expect(page.locator('.quote-line')).toHaveCount(1);
  await expect(page.locator('.quote-line')).toContainText('PG709');
  await page.reload();
  await expect(page).toHaveURL(/#\/quote$/);
  await expect(page.getByLabel(/Quantity for .*Purple Crush/)).toHaveValue('2');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lyndons-quote-v1')!))).toEqual([{ id: 'PG709', quantity: 2 }]);
});

test('legacy internal product IDs canonicalize to their real source SKU', async ({ page }) => {
  const product = products.find(item => item.sourceSku && item.sourceSku !== item.id)!;
  expect(product).toBeDefined();
  await unlock(page, `#/product/${encodeURIComponent(product.id)}`);
  await expect.poll(() => new URL(page.url()).hash).toBe(`#/product/${encodeURIComponent(product.sourceSku!)}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(product.name);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(product.name);
  await expect(page.getByRole('main').getByRole('link', { name: 'Original product listing', exact: true })).toHaveAttribute('href', product.source);
});

test('one live search supports fuzzy home results, submission, and searching from non-listing pages', async ({ page }) => {
  await unlock(page);
  const search = page.getByRole('searchbox', { name: 'Search products or product codes', exact: true });
  await oneSearch(page);
  await search.fill('wheelbarow');
  await expect(search).toBeFocused();
  await expect(page).toHaveURL(/#\/home\?q=wheelbarow$/);
  await expect(page.getByRole('status').filter({ hasText: 'No exact text match.' })).toBeVisible();
  await expect(page.locator('.product-card').first()).toContainText(/wheelbarrow/i);
  await search.fill('SIKA212');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('Code: SIKA212');
  await search.press('Enter');
  await expect(page).toHaveURL(/#\/products\?q=SIKA212$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for “SIKA212”');
  await page.goBack();
  await expect(page).toHaveURL(/#\/home\?q=SIKA212$/);
  await expect(search).toHaveValue('SIKA212');
  await navigate(page, 'Catalogues & data sheets');
  await search.fill('DRIL16X390XMAX');
  await expect(page).toHaveURL(/#\/catalogues$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Catalogues & data sheets');
  await page.getByRole('button', { name: 'Search products', exact: true }).click();
  await expect(page).toHaveURL(/#\/products\?q=DRIL16X390XMAX$/);
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('DRIL16X390XMAX');
  await page.reload();
  await expect(search).toHaveValue('DRIL16X390XMAX');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await oneSearch(page);
});

test('home updates rotate, pause, announce manual changes, and link to real destinations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await unlock(page);
  const updates = page.getByRole('region', { name: 'Updates and useful information', exact: true });
  await expect(updates).toHaveAttribute('aria-roledescription', 'carousel');
  await expect(updates.getByRole('group')).toHaveCount(1);
  await expect(updates.getByRole('group', { name: '1 of 3', exact: true })).toBeVisible();
  // The gate's submit position overlaps this carousel on desktop. Hovering
  // intentionally pauses it, so move the real pointer away before timing it.
  await page.mouse.move(0, 0);
  await page.clock.fastForward(7001);
  await expect(updates.getByRole('group', { name: '2 of 3', exact: true })).toBeVisible();
  await updates.getByRole('button', { name: 'Pause updates', exact: true }).click();
  await page.clock.fastForward(21001);
  await expect(updates.getByRole('group', { name: '2 of 3', exact: true })).toBeVisible();
  await updates.getByRole('button', { name: 'Next update', exact: true }).click();
  await expect(updates.getByRole('group', { name: '3 of 3', exact: true })).toBeVisible();
  await expect(updates.getByRole('status')).toHaveText('Panel 3 of 3: Explore the Flextool range.');
  await expect(updates.getByRole('button', { name: 'Show update 3', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await updates.getByRole('button', { name: 'Next update', exact: true }).click();
  await expect(updates.getByRole('group', { name: '1 of 3', exact: true })).toBeVisible();
  await updates.getByRole('button', { name: 'Previous update', exact: true }).click();
  await expect(updates.getByRole('group', { name: '3 of 3', exact: true })).toBeVisible();
  await updates.getByRole('link', { name: 'View catalogue library', exact: true }).click();
  await expect(page).toHaveURL(/#\/catalogues$/);
  await expect(page.getByRole('heading', { name: 'Flextool product catalogue', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Lyndons home', exact: true }).click();
  await updates.getByRole('button', { name: 'Show update 2', exact: true }).click();
  await updates.getByRole('link', { name: 'Find a branch', exact: true }).click();
  await expect(page).toHaveURL(/#\/branches$/);
});

test('reduced motion and keyboard focus stop automatic home updates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await unlock(page);
  const updates = page.getByRole('region', { name: 'Updates and useful information', exact: true });
  await expect(updates.getByRole('button', { name: 'Play updates', exact: true })).toBeVisible();
  await page.clock.fastForward(21001);
  await expect(updates.getByRole('group', { name: '1 of 3', exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await updates.getByRole('button', { name: 'Play updates', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('searchbox', { name: 'Search products or product codes', exact: true }).focus();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(7001);
  await expect(updates.getByRole('group', { name: '2 of 3', exact: true })).toBeVisible();
  await updates.getByRole('link', { name: 'Find a branch', exact: true }).focus();
  await expect(updates.getByRole('button', { name: 'Play updates', exact: true })).toBeVisible();
  await page.clock.fastForward(21001);
  await expect(updates.getByRole('group', { name: '2 of 3', exact: true })).toBeVisible();
});

test('documents retain provenance and local downloads; branch selection is shared with the quote', async ({ page }) => {
  await unlock(page, '#/catalogues');
  await expect(page.getByRole('main')).toContainText('No complete, current Lyndons PDF catalogue has been verified.');
  await expect(page.getByRole('heading', { name: 'Archived offers — expired', exact: true })).toBeVisible();
  for (const catalogue of catalogues) {
    await expect(page.getByRole('link', { name: `View ${catalogue.title}`, exact: true })).toHaveAttribute('href', catalogue.url);
  }
  for (const title of ['Lyndons online product list', 'Flextool product catalogue', 'Lyndons archived offers']) {
    const promised = page.waitForEvent('download');
    await page.getByRole('link', { name: `Download ${title}`, exact: true }).click();
    const download = await promised;
    expect(await download.failure()).toBeNull();
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const content = Buffer.concat(chunks).toString();
    if (title === 'Lyndons online product list') {
      expect(content).toContain('DRIL16X390XMAX');
      expect(content).toContain('PG709');
    } else expect(content.startsWith('%PDF-')).toBe(true);
  }
  await navigate(page, 'Branches');
  await expect(page.getByRole('main').getByRole('article')).toHaveCount(12);
  const branch = branches.find(item => item.name === 'Maroochydore')!;
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Lyndons Maroochydore', exact: true }) });
  await expect(card.getByRole('link', { name: branch.email, exact: true })).toHaveAttribute('href', 'mailto:maroochy@lyndons.com.au');
  await card.getByRole('button', { name: 'Choose this branch', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Selected branch', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(card.getByRole('button', { name: 'Selected branch', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Lyndons home', exact: true }).click();
  await page.getByRole('button', { name: 'Add OneMix Concrete Mix to quote', exact: true }).click();
  await page.getByRole('link', { name: 'Your quote, 1 items', exact: true }).click();
  await page.getByRole('button', { name: 'Add your details', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Preferred branch *', exact: true })).toHaveValue('Maroochydore');
});

test('invalid routes and SKU escapes have recoverable not-found pages; stale listing filters are canonicalized', async ({ page }) => {
  await unlock(page, '#/not-a-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await page.getByRole('main').getByRole('link', { name: 'Browse products', exact: true }).click();
  await expect(page).toHaveURL(/#\/products$/);
  for (const hash of ['#/product/NO-SUCH-SKU', '#/product/%E0%A4%A']) {
    await page.goto(`./${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Product not found');
    await expect(page.getByRole('button', { name: 'Add to quote', exact: true })).toHaveCount(0);
  }
  await page.goto('./#/products?category=missing&brand=missing&subcategory=missing&sort=bad&page=999999');
  await expect(page).toHaveURL(/#\/products\?page=86$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('All products');
  await expect(page.locator('.product-card')).toHaveCount(21);
  await page.goto('./#/products?q=SIKA212&page=999999');
  await expect(page).toHaveURL(/#\/products\?q=SIKA212$/);
  await expect(page.locator('.product-card')).toHaveCount(1);
});

test('routed listing, product, library, branches and help remain accessible and fit narrow screens', async ({ page }) => {
  await unlock(page, '#/products');
  for (const hash of ['#/products', '#/product/PG709', '#/catalogues', '#/branches', '#/help']) {
    await page.goto(`./${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${hash} at ${width}px`).toBe(true);
    }
  }
});