import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { products, categories } from '../src/data/catalog';

test('complete published import has unique references, photos and explicit provenance', () => {
  expect(products).toHaveLength(3853);
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
  const first = await page.locator('.product-title').first().textContent();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByLabel('Catalogue page', { exact: true })).toHaveValue('1');
  expect(await page.locator('.product-title').first().textContent()).not.toBe(first);
  await page.getByLabel('Browse all categories', { exact: true }).selectOption('Safety & PPE');
  await expect(page.getByLabel('Catalogue page', { exact: true })).toHaveValue('0');
  await page.getByLabel('Browse all categories', { exact: true }).selectOption('All products');
  await page.getByLabel('Search this catalogue').fill('DRIL16X390XMAX');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.product-photo').click();
  await expect(page.getByRole('dialog')).toContainText('Imported listing — confirmation required.');
  await expect(page.getByRole('dialog')).toContainText('DRIL16X390XMAX');
  await expect(page.getByRole('dialog')).toContainText('SDS MAX / SDS Plus');
  await page.getByRole('dialog').getByLabel('Quantity', { exact: true }).fill('3');
  await page.getByRole('dialog').getByRole('button', { name: 'Add to quote', exact: true }).click();
  await page.getByRole('button', { name: 'Your quote, 3 items', exact: true }).click();
  await expect(page.locator('.quote-line')).toContainText('16MM X 390MM');
  await expect(page.locator('.quote-line')).toContainText('DRIL16X390XMAX');
});