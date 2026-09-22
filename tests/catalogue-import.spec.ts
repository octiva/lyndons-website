import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { products, categories, productFamilies } from '../src/data/catalog';

test('complete published import has unique references, photos and explicit provenance', () => {
  expect(products).toHaveLength(3853);
  expect(productFamilies.size).toBe(2061);
  expect([...productFamilies.values()].flat().map(product => product.id).sort()).toEqual(products.map(product => product.id).sort());
  expect(new Set(products.map(p => p.id)).size).toBe(products.length);
  expect(categories).toHaveLength(18);
  for (const p of products) {
    expect(p.source).toMatch(/^https:\/\/lyndons\.com\.au\/products\//);
    expect(p.description.trim().length).toBeGreaterThan(0);
    if (p.image) expect(existsSync(path.join('public', p.image.replace('/lyndons-website/', '')))).toBe(true);
    if (p.imported) expect(p.manufacturer).toMatch(/not independently verified|Not identified/);
  }
  expect(readFileSync('public/catalogues/lyndons-product-catalogue-november-2022.pdf').subarray(0, 5).toString()).toBe('%PDF-');
});
test('pagination, all categories and an imported variant work in the quote basket', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.locator('.product-card')).toHaveCount(24);
  await expect(page.getByRole('region', { name: 'Product results', exact: true }).getByRole('status')).toHaveText('2,061 products · 3,853 options');
  const titles = page.locator('.product-card h3');
  const first = await titles.first().textContent();
  await page.getByRole('navigation', { name: 'Catalogue pages', exact: true }).getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Catalogue page', exact: true })).toHaveValue('2');
  await expect(titles.first()).not.toHaveText(first!);
  await page.getByRole('link', { name: 'All categories', exact: true }).click();
  const directory = page.getByRole('main');
  for (const category of categories) {
    await expect(directory.getByRole('link').filter({ has: page.getByText(category, { exact: true }) })).toHaveCount(1);
  }
  await directory.getByRole('link').filter({ has: page.getByText('Safety & PPE', { exact: true }) }).click();
  await expect(page.getByRole('combobox', { name: 'Catalogue page', exact: true })).toHaveValue('1');
  await expect(page).not.toHaveURL(/[?&]page=/);
  await page.getByRole('link', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search products or product codes', exact: true }).fill('DRIL16X390XMAX');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.product-card').getByRole('link', { name: /^View / }).click();
  await expect(page).toHaveURL(/#\/product\/DRIL16X390XMAX$/);
  await expect(page.getByRole('main')).toContainText('Imported listing — confirmation required.');
  await expect(page.getByRole('main')).toContainText('DRIL16X390XMAX');
  await expect(page.getByRole('main')).toContainText('SDS MAX / SDS Plus');
  await page.getByLabel('Quantity', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Add to quote', exact: true }).click();
  await page.getByRole('link', { name: 'Your quote, 3 items', exact: true }).click();
  await expect(page.locator('.quote-line')).toContainText('16MM X 390MM');
  await expect(page.locator('.quote-line')).toContainText('DRIL16X390XMAX');
});