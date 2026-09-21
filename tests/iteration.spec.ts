import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { products, productFamilies } from '../src/data/catalog';
import { searchCatalogue } from '../src/lib/catalogue-search';
import AxeBuilder from '@axe-core/playwright';

async function unlock(page: Page) {
  await page.goto('./');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.locator('.product-card')).toHaveCount(24);
}
test('grouped catalogue keeps every SKU and ranks exact codes without inventing matches', () => {
  expect(productFamilies.size).toBe(2061);
  expect([...productFamilies.values()].flat()).toHaveLength(3853);
  expect(searchCatalogue('polyglow', 'All products', '', 'All brands', 'featured').families).toHaveLength(1);
  expect(searchCatalogue('PG709', 'All products', '', 'All brands', 'featured').families[0].id).toBe('PG709');
  expect(searchCatalogue('wheel barrow', 'All products', '', 'All brands', 'featured').matches.length).toBeGreaterThan(0);
  expect(searchCatalogue('wheelbarow', 'All products', '', 'All brands', 'featured').approximate).toBe(true);
  expect(products.filter(p => p.subcategory).length).toBeGreaterThan(3000);
});
test('grouped colours require a choice and quote the exact chosen SKU', async ({ page }) => {
  await unlock(page);
  await page.getByLabel('Search this catalogue').fill('polyglow');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('button', { name: /Choose options for PolyGlow/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Add to quote', exact: true })).toBeDisabled();
  await dialog.getByLabel('Choose size / colour').selectOption('PG709');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await dialog.getByLabel('Quantity', { exact: true }).fill('');
  await dialog.getByLabel('Quantity', { exact: true }).blur();
  await expect(dialog.getByRole('alert')).toContainText('whole number');
  await dialog.getByLabel('Quantity', { exact: true }).fill('4');
  await dialog.getByRole('button', { name: 'Add to quote', exact: true }).click();
  await page.getByRole('button', { name: 'Your quote, 4 items', exact: true }).click();
  await expect(page.locator('.quote-line')).toContainText('Purple Crush');
  await expect(page.locator('.quote-line')).toContainText('PG709');
});
test('header branch changes during review update quote and email recipient immediately', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await unlock(page);
  await page.getByRole('button', { name: 'Add OneMix Concrete Mix to quote', exact: true }).click();
  await page.getByRole('button', { name: 'Your quote, 1 items', exact: true }).click();
  await page.getByRole('button', { name: 'Add your details' }).click();
  await page.getByLabel('Your local branch', { exact: true }).selectOption('Cairns');
  await expect(page.getByLabel('Preferred branch *')).toHaveValue('Cairns');
  await page.getByLabel('Your name *', { exact: true }).fill('Iteration test');
  await page.getByLabel('Email *', { exact: true }).fill('test@example.com');
  await page.getByLabel('Phone *', { exact: true }).fill('0400 000 000');
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open email to Cairns' })).toHaveAttribute('href', /^mailto:cairns@/);
  await page.getByLabel('Your local branch', { exact: true }).selectOption('Townsville');
  await expect(page.getByRole('link', { name: 'Open email to Townsville' })).toHaveAttribute('href', /^mailto:townsville@/);
});
test('category controls reset brands consistently and expose source subcategories', async ({ page }) => {
  await unlock(page);
  await page.getByLabel('Filter by brand').selectOption('TOPCON');
  await page.getByLabel('Browse all categories', { exact: true }).selectOption('Concrete & cement');
  await expect(page.getByLabel('Filter by brand')).toHaveValue('All brands');
  await page.getByLabel('Narrow by product type').selectOption('Cementitious Bagged Products');
  await expect(page.locator('.product-card')).toHaveCount(24);
  await page.getByLabel('Filter by brand').selectOption('Sika');
  await page.locator('.category-tiles').getByRole('button', { name: 'Masonry', exact: true }).click();
  await expect(page.getByLabel('Filter by brand')).toHaveValue('All brands');
  await expect(page.getByLabel('Narrow by product type')).toHaveValue('');
});
test('session-storage failure does not require two password entries', async ({ page }) => {
  await page.addInitScript(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'lyndons-preview') throw new DOMException('Disabled', 'SecurityError'); return original.call(this, key, value); }; });
  await unlock(page);
  await page.getByRole('button', { name: 'Lock preview' }).click();
  await expect(page.getByLabel('Preview password', { exact: true })).toBeVisible();
});
test('locking a contact draft offers cancellation and clears personal details only after confirmation', async ({ page }) => {
  await unlock(page);
  await page.getByRole('button', { name: 'Add OneMix Concrete Mix to quote', exact: true }).click();
  await page.getByRole('button', { name: 'Your quote, 1 items', exact: true }).click();
  await page.getByRole('button', { name: 'Add your details' }).click();
  await page.getByLabel('Your name *', { exact: true }).fill('Unsaved contact');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Lock preview' }).click();
  await expect(page.getByLabel('Your name *', { exact: true })).toHaveValue('Unsaved contact');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lock preview' }).click();
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.getByRole('heading', { name: 'Your quote list', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add your details' }).click();
  await expect(page.getByLabel('Your name *', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('Unsaved contact');
});