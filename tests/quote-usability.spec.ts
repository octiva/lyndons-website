import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { products } from '../src/data/catalog';
import { emptyDetails, QUOTE_REQUEST_FILENAME, quoteEmail, quoteText } from '../src/lib/quote';
import type { CartLine, QuoteDetails } from '../src/lib/quote';

// Override with a source/dev server to test without a production build.
test.use({ baseURL: process.env.QUOTE_TEST_BASE_URL ?? 'http://127.0.0.1:4319/lyndons-website/' });

// Mail links are inspected, never opened; this extra guard prevents an accidental
// click from launching an external email app.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('click', event => {
      const target = event.target;
      if (target instanceof Element && target.closest('a[href^="mailto:"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  });
});

const oneItem: CartLine[] = [{ id: 'CMNT039', quantity: 1 }];
const contact: QuoteDetails = {
  ...emptyDetails,
  name: 'Test Builder',
  email: 'test@example.com',
  phone: '0400 000 000',
  branch: 'Townsville',
};
const longNotes = 'Also quote formwork timber and confirm site access. '.repeat(30);
const quantityError = 'Enter a whole number from 1 to 9999.';
const acknowledgement = 'I saved the complete request file and will attach it before sending.';

async function startQuote(page: Page, cart = oneItem) {
  await page.addInitScript(lines => {
    // Seed once only so quantity edits still have to survive a real reload.
    if (localStorage.getItem('lyndons-quote-v1') === null) {
      localStorage.setItem('lyndons-quote-v1', JSON.stringify(lines));
    }
  }, cart);
  await page.goto('./#quote');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website' }).click();
  await expect(page.getByRole('heading', { name: 'Your quote list', exact: true })).toBeVisible();
}

async function fillDetails(page: Page, notes = '') {
  await page.getByRole('button', { name: 'Add your details', exact: true }).click();
  await page.getByLabel('Your name *', { exact: true }).fill(contact.name);
  await page.getByLabel('Email *', { exact: true }).fill(contact.email);
  await page.getByLabel('Phone *', { exact: true }).fill(contact.phone);
  await page.getByRole('combobox', { name: 'Preferred branch *', exact: true }).selectOption(contact.branch);
  await page.getByRole('textbox', { name: 'Other products or job notes', exact: true }).fill(notes);
}

async function review(page: Page) {
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review & send your request', exact: true })).toBeVisible();
  await expect(page.getByText('Not sent yet.', { exact: true })).toBeVisible();
}

async function savedCart(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('lyndons-quote-v1') ?? '[]'));
}

async function downloadRequest(page: Page) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download request', exact: true }).click();
  return downloadPromise;
}

test('empty quantity stays empty on blur, blocks progression, and valid edits persist without blur', async ({ page }) => {
  await startQuote(page);
  const quantity = page.getByLabel('Quantity for OneMix Concrete Mix', { exact: true });
  const next = page.getByRole('button', { name: 'Add your details', exact: true });

  await quantity.clear();
  await expect(quantity).toHaveValue('');
  await expect(next).toBeDisabled();
  await expect(page.locator('.quote-line').getByRole('alert')).toHaveCount(0);
  await quantity.blur();
  await expect(quantity).toHaveValue('');
  await expect(quantity).toHaveAttribute('aria-invalid', 'true');
  await expect(quantity).toHaveAccessibleDescription(quantityError);
  await expect(page.locator('.quote-line').getByRole('alert')).toHaveText(quantityError);
  expect(await savedCart(page)).toEqual(oneItem);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);

  await quantity.fill('12');
  await expect(next).toBeEnabled();
  await expect(page.locator('.quote-line').getByRole('alert')).toHaveCount(0);
  await expect.poll(() => savedCart(page)).toEqual([{ id: 'CMNT039', quantity: 12 }]);
  await page.reload();
  await expect(quantity).toHaveValue('12');
  await page.getByRole('button', { name: 'Increase OneMix Concrete Mix', exact: true }).click();
  await expect(quantity).toHaveValue('13');
});

test('invalid integer drafts are never clamped; correcting to the previous value unblocks the list', async ({ page }) => {
  await startQuote(page);
  const quantity = page.getByLabel('Quantity for OneMix Concrete Mix', { exact: true });
  const next = page.getByRole('button', { name: 'Add your details', exact: true });

  for (const draft of ['0', '-1', '2.5', '1e2', '10000', 'abc', ' 2 ']) {
    await quantity.fill(draft);
    await quantity.blur();
    await expect(quantity).toHaveValue(draft);
    await expect(quantity).toHaveAccessibleDescription(quantityError);
    await expect(next).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Increase OneMix Concrete Mix', exact: true })).toBeDisabled();
    expect(await savedCart(page)).toEqual(oneItem);
  }

  await quantity.fill('1');
  await expect(next).toBeEnabled();
  await expect(page.locator('.quote-line').getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Decrease OneMix Concrete Mix', exact: true })).toBeDisabled();
  await quantity.fill('9999');
  await expect(next).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Increase OneMix Concrete Mix', exact: true })).toBeDisabled();
  await expect.poll(() => savedCart(page)).toEqual([{ id: 'CMNT039', quantity: 9999 }]);
});

test('another valid line cannot clear an invalid draft; removing the invalid line unblocks progression', async ({ page }) => {
  const other = products.find(product => product.id !== 'CMNT039')!;
  await startQuote(page, [...oneItem, { id: other.id, quantity: 1 }]);
  const quantity = page.getByLabel('Quantity for OneMix Concrete Mix', { exact: true });
  await quantity.clear();
  await quantity.blur();
  await page.getByLabel(`Quantity for ${other.name}`, { exact: true }).fill('3');
  await expect(quantity).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Add your details', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Remove OneMix Concrete Mix', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add your details', exact: true })).toBeEnabled();
});

test('cart shows the source SKU rather than an internal catalogue ID', async ({ page }) => {
  const product = products.find(item => item.sourceSku && item.sourceSku !== item.id)!;
  expect(product).toBeDefined();
  await startQuote(page, [{ id: product.id, quantity: 1 }]);
  await expect(page.locator('.cart-product small')).toHaveText(`Ref: ${product.sourceSku}`);
});

test('required contact and delivery fields retain native form validation', async ({ page }) => {
  await startQuote(page);
  await page.getByRole('button', { name: 'Add your details', exact: true }).click();
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A few job details', exact: true })).toBeVisible();
  expect(await page.getByLabel('Your name *', { exact: true }).evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
  await page.getByLabel('Your name *', { exact: true }).fill(contact.name);
  await page.getByLabel('Email *', { exact: true }).fill('not-an-email');
  await page.getByLabel('Phone *', { exact: true }).fill(contact.phone);
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  expect(await page.getByLabel('Email *', { exact: true }).evaluate(input => (input as HTMLInputElement).validity.typeMismatch)).toBe(true);
  await page.getByLabel('Email *', { exact: true }).fill(contact.email);
  await page.getByLabel('Deliver to site', { exact: true }).check();
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A few job details', exact: true })).toBeVisible();
  expect(await page.getByLabel('Delivery address *', { exact: true }).evaluate(input => (input as HTMLTextAreaElement).validity.valueMissing)).toBe(true);
});

test('short email drafts include the complete request and highlight the selected branch', async ({ page }) => {
  await startQuote(page);
  await fillDetails(page);
  await expect(page.locator('.quote-summary').getByText('Lyndons Townsville', { exact: true })).toBeVisible();
  await review(page);
  await expect(page.locator('.review-summary').getByText('Lyndons Townsville', { exact: true })).toBeVisible();
  await expect(page.getByText('The full request will be included in your email draft. No attachment is required.')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: acknowledgement, exact: true })).toHaveCount(0);

  const href = await page.getByRole('link', { name: 'Open email to Townsville', exact: true }).getAttribute('href');
  const draft = new URL(href!);
  expect(draft.protocol).toBe('mailto:');
  expect(draft.pathname).toBe('townsville@lyndons.com.au');
  expect(draft.searchParams.get('body')).toBe(quoteText(oneItem, contact));
  expect(draft.searchParams.get('subject')).toBe('Quote request — Test Builder');
});

test('long email requires download then acknowledgement before offering a draft', async ({ page }) => {
  await startQuote(page);
  await fillDetails(page, longNotes);
  await review(page);
  await expect(page.getByRole('note', { name: 'Attachment required before sending' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();
  await expect(page.locator('.review-panel a[href^="mailto:"]')).toHaveCount(0);
  const checkbox = page.getByRole('checkbox', { name: acknowledgement, exact: true });
  await expect(checkbox).toBeDisabled();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);

  const download = await downloadRequest(page);
  expect(download.suggestedFilename()).toBe(QUOTE_REQUEST_FILENAME);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toBe(quoteText(oneItem, { ...contact, notes: longNotes }));
  await expect(page.getByText('Download requested. Check that the file was saved, then attach it to the draft yourself.')).toBeVisible();
  await expect(checkbox).toBeEnabled();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();
  await expect(page.locator('.review-panel a[href^="mailto:"]')).toHaveCount(0);
  await checkbox.check();
  const href = await page.getByRole('link', { name: 'Open email to Townsville', exact: true }).getAttribute('href');
  const body = new URL(href!).searchParams.get('body');
  expect(body).toContain(`Attach the downloaded ${QUOTE_REQUEST_FILENAME} file before sending`);
  expect(body).not.toContain(longNotes);
  await expect(page.getByText('Not sent yet.', { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  expect(saved).not.toContain(contact.email);
  expect(saved).not.toContain(longNotes);
});

test('copying does not bypass the attachment gate; explicit acknowledgement is reversible', async ({ page }) => {
  await startQuote(page);
  await fillDetails(page, longNotes);
  await review(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
  });
  await page.getByRole('button', { name: 'Copy request', exact: true }).click();
  await expect(page.getByText('Copied to clipboard.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: acknowledgement, exact: true })).toBeDisabled();
  await downloadRequest(page);
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: acknowledgement, exact: true }).check();
  await expect(page.getByRole('link', { name: 'Open email to Townsville', exact: true })).toHaveAttribute('href', /^mailto:townsville@lyndons.com.au\?/);
  await page.getByRole('checkbox', { name: acknowledgement, exact: true }).uncheck();
  await expect(page.locator('.review-panel a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();
});

test('editing quote text or quantities resets attachment readiness for the revised request', async ({ page }) => {
  await startQuote(page);
  await fillDetails(page, longNotes);
  await review(page);
  await downloadRequest(page);
  await page.getByRole('checkbox', { name: acknowledgement, exact: true }).check();
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await page.getByRole('textbox', { name: 'Other products or job notes', exact: true }).fill(`${longNotes} Revised.`);
  await review(page);
  await expect(page.getByRole('checkbox', { name: acknowledgement, exact: true })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: acknowledgement, exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();

  await downloadRequest(page);
  await page.getByRole('checkbox', { name: acknowledgement, exact: true }).check();
  await expect(page.getByRole('link', { name: 'Open email to Townsville', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await page.getByRole('button', { name: 'Back to your list', exact: true }).click();
  await page.getByLabel('Quantity for OneMix Concrete Mix', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Add your details', exact: true }).click();
  await review(page);
  await expect(page.getByRole('checkbox', { name: acknowledgement, exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open email to Townsville', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await page.getByRole('textbox', { name: 'Other products or job notes', exact: true }).clear();
  await review(page);
  await expect(page.getByRole('link', { name: 'Open email to Townsville', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: acknowledgement, exact: true })).toHaveCount(0);
});

test('email handoff uses the exact encoded-body cutoff, not the unencoded character count', () => {
  for (const text of ['a'.repeat(1499), `${'a'.repeat(1490)}é`]) {
    const draft = quoteEmail(text, contact, 'townsville@lyndons.com.au');
    expect(draft.requiresAttachment).toBe(false);
    expect(new URL(draft.href).searchParams.get('body')).toBe(text);
  }
  for (const text of ['a'.repeat(1500), 'é'.repeat(250)]) {
    const draft = quoteEmail(text, contact, 'townsville@lyndons.com.au');
    expect(draft.requiresAttachment).toBe(true);
    expect(new URL(draft.href).searchParams.get('body')).toContain(QUOTE_REQUEST_FILENAME);
  }
});