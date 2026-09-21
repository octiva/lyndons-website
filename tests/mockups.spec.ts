import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openMockup(page: Page) {
  await page.goto('mockups/');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'View the concepts' }).click();
  await expect(page.getByRole('heading', { name: 'Materials, tools and practical advice.' })).toBeVisible();
}
test('mockup has separate pages and an isolated demo quote', async ({ page }) => {
  await openMockup(page);
  await expect(page.locator('#content .product-grid')).toHaveCount(0);
  await expect(page.locator('#content .document-table')).toHaveCount(0);
  await page.getByRole('link', { name: /^Browse products/ }).click();
  await expect(page).toHaveURL(/#\/products$/);
  const loaded = await page.locator('.product-picture img').evaluateAll(async images => {
    return Promise.all(images.map(async node => {
      const img = node as HTMLImageElement;
      img.loading = 'eager';
      await img.decode();
      return img.naturalWidth > 0;
    }));
  });
  expect(loaded).toEqual(Array(8).fill(true));
  await page.locator('.product-card').first().getByRole('link', { name: 'OneMix Concrete Mix', exact: true }).last().click();
  await expect(page).toHaveURL(/#\/product\/CMNT039$/);
  await page.getByLabel('Quantity', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Add to quote', exact: true }).click();
  await page.locator('.quote-link').click();
  await expect(page).toHaveURL(/#\/quote$/);
  await expect(page.getByLabel('Quantity for OneMix Concrete Mix')).toHaveValue('3');
  await page.getByRole('button', { name: 'Review demo list' }).click();
  await expect(page.locator('#demo-review-message')).toContainText('Nothing has been sent');
  expect(await page.evaluate(() => localStorage.getItem('lyndons-quote-v1'))).toBeNull();
});
test('Supply Desk is a different layout with exact-code quick add', async ({ page }) => {
  await openMockup(page);
  await page.getByRole('button', { name: 'B Supply Desk' }).click();
  await expect(page.getByRole('heading', { name: 'What’s on your list?' })).toBeVisible();
  await page.getByLabel('Product code', { exact: true }).fill('CMNT039');
  await page.getByLabel('Qty', { exact: true }).fill('2');
  await page.locator('.quick-form').getByRole('button', { name: 'Add to quote' }).click();
  await expect(page.locator('#quote-count')).toHaveText('2');
  await page.getByLabel('Product code', { exact: true }).fill('not-a-code');
  await page.locator('.quick-form').getByRole('button', { name: 'Add to quote' }).click();
  await expect(page.locator('.quick-error')).toContainText('not in this sample');
  await page.getByRole('link', { name: /^Browse products/ }).click();
  await expect(page.locator('.supply-row')).toHaveCount(8);
  await expect(page.locator('.product-card')).toHaveCount(0);
});
test('mockup category filters, search, back navigation and document links work', async ({ page }) => {
  await openMockup(page);
  await page.locator('.category-grid').getByRole('link', { name: /Concrete & cement/ }).click();
  await expect(page.locator('.product-card')).toHaveCount(5);
  const toggle = page.getByRole('button', { name: 'Filters & categories' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByLabel('Brand', { exact: true }).selectOption('Sika');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goBack();
  await expect(page.locator('.product-card')).toHaveCount(5);
  await page.getByLabel('Search products or product codes').fill('CMNT039');
  await page.getByRole('button', { name: 'Search products', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goto('mockups/#/catalogues');
  await page.reload();
  // Gate is intentionally memory-only after a document reload.
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'View the concepts' }).click();
  await expect(page.locator('.document-table article')).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'Download Lyndons November 2022 offers', exact: true })).toHaveAttribute('download', '');
  await expect(page.locator('.notice-box')).toContainText('expired offers flyer');
});
test('both design directions fit mobile and pass key-screen accessibility checks', async ({ page }) => {
  await openMockup(page);
  for (const concept of ['A Trade Counter', 'B Supply Desk']) {
    await page.getByRole('button', { name: concept }).click();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  }
  await page.getByRole('link', { name: /^Browse products/ }).click();
  await page.locator('.supply-row').first().getByRole('link', { name: 'OneMix Concrete Mix', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});