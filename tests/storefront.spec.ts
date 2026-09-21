import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { safeCart, quoteText, emptyDetails } from '../src/lib/quote';
import { products } from '../src/data/catalog';

async function unlock(page: Page) {
  await page.goto('./');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.getByRole('heading', { name: /The right supplies/ })).toBeVisible();
}
async function startQuote(page: Page) {
  await unlock(page);
  await page.getByRole('button', { name: 'Add OneMix Concrete Mix to quote', exact: true }).click();
  await page.getByRole('button', { name: 'Your quote, 1 items', exact: true }).click();
}
test('password rejects invalid input, unlocks, and locks again', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Preview password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.getByRole('alert')).toContainText('isn’t right');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.locator('.product-card')).toHaveCount(24);
  await page.reload();
  await expect(page.locator('.product-card')).toHaveCount(24);
  await page.getByRole('button', { name: 'Lock preview' }).click();
  await expect(page.getByLabel('Preview password', { exact: true })).toBeVisible();
});
test('search, category, brand, empty state and product dialog work', async ({ page }) => {
  await unlock(page);
  await page.getByLabel('Search this catalogue').fill('SIKA212');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'View SikaGrout®-212 HP', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Sika Australia');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search this catalogue').fill('nothing-matches-this');
  await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
  await page.locator('.category-tiles').getByRole('button', { name: 'Masonry', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(Math.min(24, products.filter(p => p.category === 'Masonry').length));
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByLabel('Filter by brand').selectOption('TOPCON');
  await expect(page.locator('.product-card')).toHaveCount(products.filter(p => p.brand.toLowerCase() === 'topcon').length);
  await expect(page.locator('.product-card').first()).toContainText('RL-H5A');
});
test('cart persists, supports quantities and removal', async ({ page }) => {
  await startQuote(page);
  await page.getByLabel('Quantity for OneMix Concrete Mix').fill('12');
  await page.reload();
  await expect(page.getByLabel('Quantity for OneMix Concrete Mix')).toHaveValue('12');
  await page.getByRole('button', { name: 'Increase OneMix Concrete Mix' }).click();
  await expect(page.getByLabel('Quantity for OneMix Concrete Mix')).toHaveValue('13');
  await page.getByRole('button', { name: 'Remove OneMix Concrete Mix' }).click();
  await expect(page.getByRole('heading', { name: 'Your quote list is empty' })).toBeVisible();
});
test('quote validates delivery details, downloads and prepares a branch email without sending', async ({ page }) => {
  await startQuote(page);
  await page.getByRole('button', { name: 'Add your details' }).click();
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A few job details' })).toBeVisible();
  await page.getByLabel('Your name *', { exact: true }).fill('Test Builder');
  await page.getByLabel('Email *', { exact: true }).fill('test@example.com');
  await page.getByLabel('Phone *', { exact: true }).fill('0400 000 000');
  await page.getByLabel('Preferred branch *').selectOption('Townsville');
  await page.getByLabel('Deliver to site').check();
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A few job details' })).toBeVisible();
  await page.getByLabel('Delivery address *').fill('123 Test Road, Townsville QLD');
  await page.getByLabel('Other products or job notes').fill('Also quote 20 lengths of formwork timber.');
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review & send your request' })).toBeVisible();
  await expect(page.getByText('Not sent yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open email to Townsville' })).toHaveAttribute('href', /^mailto:townsville@lyndons.com.au\?/);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download request' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('lyndons-quote-request.txt');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();
  expect(body).toContain('1 × OneMix Concrete Mix'); expect(body).toContain('Townsville'); expect(body).toContain('formwork timber');
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  expect(saved).not.toContain('test@example.com'); expect(saved).not.toContain('Test Road');
});
test('gate, catalogue and quote details pass automated accessibility checks', async ({ page }) => {
  await page.goto('./');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await unlock(page);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Add OneMix Concrete Mix to quote', exact: true }).click();
  await page.getByRole('button', { name: 'Your quote, 1 items', exact: true }).click();
  await page.getByRole('button', { name: 'Add your details' }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
test('layout fits narrow phones through desktop; branch choice persists', async ({ page }) => {
  await unlock(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByLabel('Choose your branch').selectOption('Cairns');
  await page.reload();
  await expect(page.getByLabel('Choose your branch')).toHaveValue('Cairns');
});
test('contact draft survives browsing but is not stored and clears on reload', async ({ page }) => {
  await startQuote(page);
  await page.getByRole('button', { name: 'Add your details' }).click();
  await page.getByLabel('Your name *', { exact: true }).fill('Draft Builder');
  await page.getByLabel('Preferred branch *').selectOption('Cairns');
  await page.getByRole('button', { name: 'Continue browsing' }).click();
  await page.getByRole('button', { name: 'Your quote, 1 items', exact: true }).click();
  await page.getByRole('button', { name: 'Add your details' }).click();
  await expect(page.getByLabel('Your name *', { exact: true })).toHaveValue('Draft Builder');
  await expect(page.getByLabel('Preferred branch *')).toHaveValue('Cairns');
  await page.reload();
  await page.getByRole('button', { name: 'Add your details' }).click();
  await expect(page.getByLabel('Your name *', { exact: true })).toHaveValue('');
});
test('unavailable product photos have an honest visible fallback', async ({ page }) => {
  const imagePath = new URL(products[0].image, 'http://localhost').pathname;
  await page.route(`**${imagePath}`, route => route.abort());
  await unlock(page);
  await page.getByRole('button', { name: 'View OneMix Concrete Mix', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.locator('.product-card').first().getByText('Photo unavailable')).toBeVisible();
});
test('cart data is sanitised and quote output omits stale pickup address', () => {
  expect(safeCart([{ id: 'unknown', quantity: 2 }, { id: 'CMNT039', quantity: -1 }, { id: 'CMNT039', quantity: 2.5 }])).toEqual([]);
  expect(safeCart([{ id: 'CMNT039', quantity: 99999 }, { id: 'CMNT039', quantity: 2 }])).toEqual([{ id: 'CMNT039', quantity: 9999 }]);
  expect(quoteText([{ id: 'CMNT039', quantity: 2 }], { ...emptyDetails, address: 'stale address' })).not.toContain('stale address');
});