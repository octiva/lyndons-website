import type { QuoteDetails } from './quote';

export const contactValidationFields = ['name', 'phone', 'address', 'date'] as const;
export type ContactValidationField = typeof contactValidationFields[number];
export type ContactValidationErrors = Partial<Record<ContactValidationField, string>>;

// Use local calendar parts, not a UTC date. Callers supply the current time so
// validation is pure and an open form can be rechecked after local midnight.
export function localDateString(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Dates come from a native date input as YYYY-MM-DD (or blank when optional).
export function requestedDateError(date: string, now: Date): string | undefined {
  return date && date < localDateString(now) ? 'Choose today or a future date.' : undefined;
}

export function validateContactDetails(
  details: Pick<QuoteDetails, ContactValidationField | 'fulfilment'>,
  now: Date,
): ContactValidationErrors {
  const errors: ContactValidationErrors = {};
  if (!details.name.trim()) errors.name = 'Enter your name (not just spaces).';

  const phone = details.phone.trim();
  const digits = phone.replace(/[^0-9]/g, '').length;
  // Formatting only: this does not verify an active service or a country code.
  if (!/^[+0-9 ()-]+$/.test(phone) || digits < 6 || digits > 15) {
    errors.phone = 'Enter 6 to 15 digits, using only +, spaces, parentheses or hyphens for formatting.';
  }
  if (details.fulfilment === 'delivery' && !details.address.trim()) {
    errors.address = 'Enter a delivery address (not just spaces).';
  }
  const dateError = requestedDateError(details.date, now);
  if (dateError) errors.date = dateError;
  return errors;
}

// Keep the editable draft intact until submission succeeds. Optional business
// and account fields stay optional; email syntax remains the browser's check.
export function normalizeContactDetails(details: QuoteDetails): QuoteDetails {
  return {
    ...details,
    name: details.name.trim(),
    company: details.company.trim(),
    account: details.account.trim(),
    email: details.email.trim(),
    phone: details.phone.trim(),
    address: details.address.trim(),
  };
}