import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto('mockups/');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'View the concepts' }).click();
});
test('only banner search remains; fuzzy matches update homepage tiles without adding automatically', async ({ page }) => {
  await expect(page.getByRole('search')).toHaveCount(1);
  await expect(page.locator('input[type="search"]')).toHaveCount(1);
  await expect(page.locator('#content form[role="search"]')).toHaveCount(0);
  await expect(page.locator('.search-first > section')).toHaveCount(3);
  await expect(page.locator('.search-first > section').nth(0)).toHaveClass('landing-intro');
  await expect(page.locator('.search-first > section').nth(1)).toHaveClass('updates');
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(8);
  await page.getByLabel('Search products or product codes').fill('concreet mix');
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(2);
  await expect(page.locator('#home-match-note')).toContainText('Close matches');
  await expect(page.locator('#quote-count')).toHaveText('0');
  await page.getByLabel('Search products or product codes').fill('SIKA212');
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(1);
  await expect(page.locator('#home-product-grid')).toContainText('SikaGrout');
  await page.getByLabel('Search products or product codes').fill('zzzzzzzz');
  await expect(page.getByRole('heading', { name: 'No matching sample products' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all sample products' }).click();
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(8);
  await expect(page.getByLabel('Search products or product codes')).toBeFocused();
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
  await expect(page.locator('#home-product-grid .product-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Search products', exact: true }).click();
  await expect(page).toHaveURL(/#\/products\?q=concret\+mix/);
  await expect(page.locator('.product-card')).toHaveCount(2);
});