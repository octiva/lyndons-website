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
  await page.getByRole('searchbox', { name: 'Search products or product codes', exact: true }).fill('polyglow');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Choose options for PolyGlow/ }).click();
  await expect(page).toHaveURL(/#\/product\/[^?]+\?choose=1$/);
  const product = page.getByRole('region', { name: 'Product selection', exact: true });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(product.getByRole('button', { name: 'Add to quote', exact: true })).toBeDisabled();
  const option = product.getByRole('combobox', { name: 'Choose size / colour', exact: true });
  await expect(option).toHaveValue('');
  await expect(option.locator('option')).toHaveCount(7);
  await option.selectOption('PG709');
  await expect(page).toHaveURL(/#\/product\/PG709$/);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await product.getByLabel('Quantity', { exact: true }).fill('');
  await product.getByLabel('Quantity', { exact: true }).blur();
  await expect(product.getByRole('alert')).toContainText('whole number');
  await expect(product.getByRole('button', { name: 'Add to quote', exact: true })).toBeDisabled();
  await product.getByLabel('Quantity', { exact: true }).fill('4');
  await product.getByRole('button', { name: 'Add to quote', exact: true }).click();
  await page.getByRole('link', { name: 'Your quote, 4 items', exact: true }).click();
  await expect(page.locator('.quote-line')).toContainText('Purple Crush');
  await expect(page.locator('.quote-line')).toContainText('PG709');
});
test('header branch changes during review update quote and email recipient immediately', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await unlock(page);
  await page.getByRole('button', { name: 'Add OneMix Concrete Mix to quote', exact: true }).click();
  await page.getByRole('link', { name: 'Your quote, 1 items', exact: true }).click();
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
test('category destinations reset refinements and expose source subcategories', async ({ page }) => {
  await unlock(page);
  await page.getByRole('navigation', { name: 'Footer navigation', exact: true }).getByRole('link', { name: 'Browse products', exact: true }).click();
  async function openFilters() {
    const toggle = page.getByRole('button', { name: 'Filters & categories', exact: true });
    if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  }
  await openFilters();
  const brand = page.getByRole('combobox', { name: 'Filter by brand', exact: true });
  const type = page.getByRole('combobox', { name: 'Narrow by product type', exact: true });
  await brand.selectOption('TOPCON');
  await page.getByRole('link', { name: 'Browse categories', exact: true }).click();
  await page.getByRole('main').getByRole('link').filter({ has: page.getByText('Concrete & cement', { exact: true }) }).click();
  await openFilters();
  await expect(brand).toHaveValue('All brands');
  await type.selectOption('Cementitious Bagged Products');
  await expect(page.locator('.product-card')).toHaveCount(24);
  await brand.selectOption('Sika');
  await page.getByRole('link', { name: 'Browse categories', exact: true }).click();
  await page.getByRole('main').getByRole('link').filter({ has: page.getByText('Masonry', { exact: true }) }).click();
  await openFilters();
  await expect(brand).toHaveValue('All brands');
  await expect(type).toHaveValue('');
  await expect(page.getByRole('heading', { level: 1, name: 'Masonry', exact: true })).toBeVisible();
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
  await page.getByRole('link', { name: 'Your quote, 1 items', exact: true }).click();
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