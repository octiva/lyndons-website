import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto('mockups/');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'View the concepts' }).click();
});
test('homepage order is search then updates then product tiles; fuzzy matches never add automatically', async ({ page }) => {
  await expect(page.locator('.search-first > section')).toHaveCount(3);
  await expect(page.locator('.search-first > section').nth(0)).toHaveClass('landing-search');
  await expect(page.locator('.search-first > section').nth(1)).toHaveClass('updates');
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(8);
  await page.getByLabel('Find a product', { exact: true }).fill('concreet mix');
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(2);
  await expect(page.locator('#home-match-note')).toContainText('Close matches');
  await expect(page.locator('#quote-count')).toHaveText('0');
  await page.getByLabel('Find a product', { exact: true }).fill('SIKA212');
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(1);
  await expect(page.locator('#home-product-grid')).toContainText('SikaGrout');
  await page.getByLabel('Find a product', { exact: true }).fill('zzzzzzzz');
  await expect(page.getByRole('heading', { name: 'No matching sample products' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all sample products' }).click();
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(8);
});
test('updates rotate, pause on interaction, and respect reduced motion', async ({ page }) => {
  await page.mouse.move(0, 0);
  await page.clock.fastForward(7100);
  await expect(page.locator('[data-slide]:visible')).toHaveAttribute('aria-label', '2 of 3');
  await page.getByRole('button', { name: 'Next update' }).click();
  await expect(page.locator('[data-slide]:visible')).toHaveAttribute('aria-label', '3 of 3');
  await expect(page.getByRole('button', { name: 'Play updates' })).toBeVisible();
  await page.clock.fastForward(15000);
  await expect(page.locator('[data-slide]:visible')).toHaveAttribute('aria-label', '3 of 3');
  await page.getByRole('button', { name: 'Show update 1' }).click();
  await expect(page.locator('[data-slide]:visible')).toHaveAttribute('aria-label', '1 of 3');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.masthead>a').first().click();
  await page.clock.fastForward(15000);
  await expect(page.locator('[data-slide]:visible')).toHaveAttribute('aria-label', '1 of 3');
  await expect(page.getByRole('button', { name: 'Play updates' })).toBeVisible();
});
test('each update is accessible and homepage search works from the header', async ({ page }) => {
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: `Show update ${i}` }).click();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  }
  await page.getByLabel('Search products or product codes').fill('concret mix');
  await expect(page.getByLabel('Find a product', { exact: true })).toHaveValue('concret mix');
  await page.getByRole('button', { name: 'Search products', exact: true }).first().click();
  await expect(page).toHaveURL(/#\/products\?q=concret\+mix/);
  await expect(page.locator('.product-card')).toHaveCount(2);
});