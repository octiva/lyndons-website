import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { localDateString, normalizeContactDetails, requestedDateError, validateContactDetails } from '../src/lib/contact-validation';
import type { QuoteDetails } from '../src/lib/quote';

// Source-mode testing needs no build: use the same override as quote-usability.
test.use({ baseURL: process.env.QUOTE_TEST_BASE_URL ?? 'http://127.0.0.1:4319/lyndons-website/' });

const contact: QuoteDetails = {
  name: 'Test Builder', email: 'test@example.com', phone: '+44 (20) 7946-0958',
  company: '', account: '', branch: 'Windsor', fulfilment: 'pickup',
  address: '', date: '', notes: '',
};
const nameError = 'Enter your name (not just spaces).';
const phoneError = 'Enter 6 to 15 digits, using only +, spaces, parentheses or hyphens for formatting.';
const addressError = 'Enter a delivery address (not just spaces).';
const dateError = 'Choose today or a future date.';

async function startDetails(page: Page) {
  await page.addInitScript(() => {
    // Only product selections are persisted. All contact values are synthetic
    // and entered in the form; no mail link is ever opened by these tests.
    localStorage.setItem('lyndons-quote-v1', JSON.stringify([{ id: 'CMNT039', quantity: 1 }]));
    document.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('a[href^="mailto:"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  });
  await page.goto('./#/quote');
  await page.getByLabel('Preview password', { exact: true }).fill('Whitaker');
  await page.getByRole('button', { name: 'Explore the website', exact: true }).click();
  await expect(page).toHaveURL(/#\/quote$/);
  await page.getByRole('button', { name: 'Add your details', exact: true }).click();
  await page.getByLabel('Your name *', { exact: true }).fill(contact.name);
  await page.getByLabel('Email *', { exact: true }).fill(contact.email);
  await page.getByLabel('Phone *', { exact: true }).fill(contact.phone);
}

async function submitWithoutBlur(page: Page) {
  await page.locator('#quote-details').evaluate(form => (form as HTMLFormElement).requestSubmit());
}

async function expectCustomError(input: Locator, message: string) {
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(message);
  expect(await input.evaluate(element => ({
    customError: (element as HTMLInputElement).validity.customError,
    message: (element as HTMLInputElement).validationMessage,
  }))).toEqual({ customError: true, message });
}

async function expectCorrected(input: Locator) {
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  expect(await input.evaluate(element => (element as HTMLInputElement).validity.customError)).toBe(false);
}

test('pure validation counts digits, permits international formatting, and leaves optional fields optional', () => {
  const now = new Date(2026, 8, 22, 12);
  expect(validateContactDetails(contact, now)).toEqual({});
  for (const phone of ['------', '++++++', '() () ', '12345', '+1234567890123456', '123456x', '123.456', '123/456', '123\t456']) {
    expect(validateContactDetails({ ...contact, phone }, now)).toEqual({ phone: phoneError });
  }
  for (const phone of ['123456', '+123456789012345', '+61 (0) 400-000-000', '+44 (20) 7946-0958']) {
    expect(validateContactDetails({ ...contact, phone }, now)).toEqual({});
  }
  expect(validateContactDetails({ ...contact, name: '\t \n' }, now)).toEqual({ name: nameError });
  expect(validateContactDetails({ ...contact, fulfilment: 'delivery', address: ' \n\t ' }, now)).toEqual({ address: addressError });
  expect(validateContactDetails({ ...contact, fulfilment: 'pickup', address: ' \n\t ' }, now)).toEqual({});
});

test('normalization is pure, trims contact fields, and preserves the remaining quote fields', () => {
  const draft = Object.freeze({
    ...contact, name: '  Test Builder  ', email: '  test@example.com  ', phone: '  +44 (20) 7946-0958  ',
    company: ' \t ', account: ' \n ', address: '  123 Test Road  ', notes: '  Keep job notes as entered.  ', date: '2026-09-23',
  });
  const normalized = normalizeContactDetails(draft);
  expect(normalized).toEqual({
    ...draft, name: contact.name, email: contact.email, phone: contact.phone,
    company: '', account: '', address: '123 Test Road',
  });
  expect(normalized).not.toBe(draft);
  expect(draft.name).toBe('  Test Builder  ');
  expect(normalizeContactDetails({ ...contact, company: '  Builder Co  ', account: '  A-123  ' }))
    .toMatchObject({ company: 'Builder Co', account: 'A-123' });
});

test('pure date validation uses an explicit local calendar date and rechecks after midnight', () => {
  const beforeMidnight = new Date(2026, 8, 22, 23, 59);
  const afterMidnight = new Date(2026, 8, 23, 0, 1);
  expect(localDateString(new Date(2026, 0, 2, 12))).toBe('2026-01-02');
  expect(localDateString(beforeMidnight)).toBe('2026-09-22');
  expect(requestedDateError('', beforeMidnight)).toBeUndefined();
  expect(requestedDateError('2026-09-21', beforeMidnight)).toBe(dateError);
  expect(requestedDateError('2026-09-22', beforeMidnight)).toBeUndefined();
  expect(requestedDateError('2026-09-23', beforeMidnight)).toBeUndefined();
  expect(requestedDateError('2026-09-22', afterMidnight)).toBe(dateError);
  expect(requestedDateError('2026-09-23', afterMidnight)).toBeUndefined();
});

test('whitespace name remains editable, announces on blur, and clears custom validity on correction', async ({ page }) => {
  await startDetails(page);
  const name = page.getByLabel('Your name *', { exact: true });
  await name.fill('   ');
  await expect(page.locator('#quote-details').getByRole('alert')).toHaveCount(0);
  await name.blur();
  await expect(name).toHaveValue('   ');
  await expectCustomError(name, nameError);
  await expect(page.getByRole('alert')).toHaveText(nameError);
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A few job details', exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);

  await name.fill('  Test Builder  ');
  await expect(name).toHaveValue('  Test Builder  ');
  await expectCorrected(name);
  await expect(page.getByRole('alert')).toHaveCount(0);
  // Becoming invalid again should not announce a new error on every keystroke.
  await name.fill(' ');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await submitWithoutBlur(page);
  await expectCustomError(name, nameError);
});

test('submit validates whitespace name and delivery address without relying on blur', async ({ page }) => {
  await startDetails(page);
  await page.getByLabel('Deliver to site', { exact: true }).check();
  const name = page.getByLabel('Your name *', { exact: true });
  const address = page.getByLabel('Delivery address *', { exact: true });
  await address.fill(' \n\t ');
  await name.fill('   ');
  await submitWithoutBlur(page);
  await expectCustomError(name, nameError);
  await expectCustomError(address, addressError);
  await expect(page.locator('#quote-details').getByRole('alert')).toHaveCount(2);
  await expect(address).toHaveValue(' \n\t ');

  await name.fill(contact.name);
  await address.fill('  123 Test Road  ');
  await expectCorrected(name);
  await expectCorrected(address);
  await submitWithoutBlur(page);
  await expect(page.getByRole('heading', { name: 'Review & send your request', exact: true })).toBeVisible();
  await expect(page.locator('.review-summary')).toContainText('Deliver to: 123 Test Road');
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await expect(address).toHaveValue('123 Test Road');
});

test('punctuation-only phone is blocked; valid international phone clears the error', async ({ page }) => {
  await startDetails(page);
  const phone = page.getByLabel('Phone *', { exact: true });
  await phone.fill('------');
  await expect(page.locator('#quote-details').getByRole('alert')).toHaveCount(0);
  await submitWithoutBlur(page);
  await expectCustomError(phone, phoneError);
  await expect(page.getByRole('alert')).toHaveText(phoneError);
  await expect(page.getByRole('heading', { name: 'A few job details', exact: true })).toBeVisible();
  await phone.fill('+1234567890123456');
  await phone.blur();
  await expectCustomError(phone, phoneError);
  await phone.fill('  +44 (20) 7946-0958  ');
  await expectCorrected(phone);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(phone).toHaveValue('  +44 (20) 7946-0958  ');
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review & send your request', exact: true })).toBeVisible();
  await expect(page.getByText('Not sent yet.', { exact: true })).toBeVisible();
});

test('pickup discards delivery errors and remounted delivery is validated again', async ({ page }) => {
  await startDetails(page);
  await page.getByLabel('Deliver to site', { exact: true }).check();
  const address = page.getByLabel('Delivery address *', { exact: true });
  await address.fill('   ');
  await address.blur();
  await expectCustomError(address, addressError);
  await page.getByLabel('Collect from branch', { exact: true }).check();
  await expect(address).toHaveCount(0);
  await expect(page.locator('#quote-address-error')).toHaveCount(0);
  await submitWithoutBlur(page);
  await expect(page.getByRole('heading', { name: 'Review & send your request', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await page.getByLabel('Deliver to site', { exact: true }).check();
  await submitWithoutBlur(page);
  await expectCustomError(address, addressError);
  await address.fill('123 Test Road');
  await expectCorrected(address);
});

test('native required/email checks remain; successful submission trims optional fields without persisting contact details', async ({ page }) => {
  await startDetails(page);
  const name = page.getByLabel('Your name *', { exact: true });
  const email = page.getByLabel('Email *', { exact: true });
  const company = page.getByLabel('Business name', { exact: true });
  const account = page.getByLabel('Trade account (optional)', { exact: true });
  await name.clear();
  await submitWithoutBlur(page);
  expect(await name.evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
  await name.fill('  Test Builder  ');
  await email.fill('not-an-email');
  await company.fill('   ');
  await account.fill('   ');
  await submitWithoutBlur(page);
  expect(await email.evaluate(input => (input as HTMLInputElement).validity.typeMismatch)).toBe(true);
  await expect(name).toHaveValue('  Test Builder  ');
  await expect(company).toHaveValue('   ');
  await expect(account).toHaveValue('   ');
  await email.fill('  test@example.com  ');
  await submitWithoutBlur(page);
  await expect(page.getByRole('heading', { name: 'Review & send your request', exact: true })).toBeVisible();
  await expect(page.locator('.review-summary')).toContainText('Test Builder · Personal enquiry');
  const href = await page.getByRole('link', { name: 'Open email to Windsor', exact: true }).getAttribute('href');
  const draft = new URL(href!);
  expect(draft.searchParams.get('subject')).toBe('Quote request — Test Builder');
  expect(draft.searchParams.get('body')).toContain('Name: Test Builder\nCompany: —\nEmail: test@example.com');
  expect(draft.searchParams.get('body')).toContain('Trade account: —');
  const saved = await page.evaluate(() => JSON.stringify({ local: localStorage, session: sessionStorage }));
  expect(saved).not.toContain(contact.name);
  expect(saved).not.toContain(contact.email);
  expect(saved).not.toContain(contact.phone);
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await expect(name).toHaveValue(contact.name);
  await expect(email).toHaveValue(contact.email);
  await expect(company).toHaveValue('');
  await expect(account).toHaveValue('');
});

for (const { timezoneId, before, after } of [
  { timezoneId: 'Pacific/Auckland', before: '2026-09-22T11:59:00Z', after: '2026-09-22T12:01:00Z' },
  { timezoneId: 'America/Los_Angeles', before: '2026-09-23T06:59:00Z', after: '2026-09-23T07:01:00Z' },
]) {
  test.describe(`local midnight in ${timezoneId}`, () => {
    test.use({ timezoneId });
    test('submission refreshes the date bound without a rerender or reload', async ({ page }) => {
      await page.clock.setFixedTime(new Date(before));
      await startDetails(page);
      const date = page.getByLabel('Preferred date (optional)', { exact: true });
      await expect(date).toHaveAttribute('min', '2026-09-22');
      await date.fill('2026-09-22');
      await date.blur();
      await expectCorrected(date);
      await page.clock.setFixedTime(new Date(after));
      // The page has not rerendered: submission itself must refresh the bound.
      await expect(date).toHaveAttribute('min', '2026-09-22');
      await submitWithoutBlur(page);
      await expect(date).toHaveAttribute('min', '2026-09-23');
      await expectCustomError(date, dateError);
      await expect(page.getByRole('alert')).toHaveText(dateError);
      await expect(page.getByRole('heading', { name: 'A few job details', exact: true })).toBeVisible();
      await date.fill('2026-09-23');
      await expectCorrected(date);
      await date.clear();
      await expectCorrected(date);
      await submitWithoutBlur(page);
      await expect(page.getByRole('heading', { name: 'Review & send your request', exact: true })).toBeVisible();
    });
  });
}