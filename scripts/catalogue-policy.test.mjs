import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CACHE_TTL_MS, recordRefreshReason, canPublishCatalogue, productMetadata } from './lib/catalogue-policy.mjs';

const now = Date.parse('2026-09-21T12:00:00.000Z');
const lastModified = '2026-09-20T00:00:00Z';
const cached = { checkedAt: '2026-09-20T12:00:00.000Z', sourceLastModified: lastModified };
const reason = (record = cached, lastmod = lastModified, options = {}) => recordRefreshReason(record, lastmod, { now, ...options });

test('fresh records are reused and the default TTL is exactly seven days', () => {
  assert.equal(DEFAULT_CACHE_TTL_MS, 7 * 24 * 60 * 60 * 1000);
  assert.equal(reason(), null);
  assert.equal(reason({ ...cached, checkedAt: new Date(now - DEFAULT_CACHE_TTL_MS + 1).toISOString() }), null);
  assert.equal(reason({ ...cached, checkedAt: new Date(now - DEFAULT_CACHE_TTL_MS).toISOString() }), 'ttl-expired');
  assert.equal(reason({ ...cached, checkedAt: '2025-01-01T00:00:00Z' }), 'ttl-expired');
});

test('TTL is configurable, including a zero TTL', () => {
  assert.equal(reason(cached, lastModified, { ttlMs: 12 * 60 * 60 * 1000 }), 'ttl-expired');
  assert.equal(reason(cached, lastModified, { ttlMs: 2 * 24 * 60 * 60 * 1000 }), null);
  assert.equal(reason({ ...cached, checkedAt: new Date(now).toISOString() }, lastModified, { ttlMs: 0 }), 'ttl-expired');
  for (const ttlMs of [-1, NaN, Infinity]) assert.throws(() => reason(cached, lastModified, { ttlMs }), RangeError);
  assert.throws(() => reason(cached, lastModified, { now: NaN }), RangeError);
});

test('any lastModified change refreshes even a young cached record', () => {
  assert.equal(reason(cached, '2026-09-21T00:00:00Z'), 'last-modified-changed');
  assert.equal(reason(cached, '2026-08-01T00:00:00Z'), 'last-modified-changed');
  assert.equal(reason({ checkedAt: cached.checkedAt }), 'last-modified-changed');
  assert.equal(reason(cached, ''), 'last-modified-changed');
  assert.equal(reason({ checkedAt: cached.checkedAt }, ''), null);
  assert.equal(recordRefreshReason({ checkedAt: cached.checkedAt }, undefined, { now }), null);
});

test('missing records and missing, invalid or future checkedAt timestamps refresh', () => {
  assert.equal(reason(null), 'missing-record');
  assert.equal(recordRefreshReason(undefined, lastModified, { now }), 'missing-record');
  for (const checkedAt of [undefined, null, '', 'not-a-date', 0]) {
    assert.equal(reason({ ...cached, checkedAt }), 'missing-or-invalid-timestamp');
  }
  assert.equal(reason({ ...cached, checkedAt: '2026-09-22T12:00:00Z' }), 'future-timestamp');
});

test('explicit refresh overrides cache freshness without mutating the cache', () => {
  const original = { ...cached };
  assert.equal(reason(cached, lastModified, { force: true }), 'forced');
  assert.deepEqual(cached, original);
});

const completeReport = {
  discoveredPages: 2061, attemptedPages: 2061, importedPages: 2061,
  limited: false, stopped: false, error: null, failures: [], staleRefreshFailures: [], failedPhotos: 0,
};

test('publication requires complete, unlimited, error-free collection', () => {
  assert.equal(canPublishCatalogue(completeReport), true);
  for (const partial of [
    { limited: true }, // Even when a configured limit exceeds all discovered pages.
    { stopped: true },
    { attemptedPages: 2060 },
    { importedPages: 2060 },
    { discoveredPages: 0, attemptedPages: 0, importedPages: 0 },
    { failures: [{ source: 'example', error: 'HTTP 500' }] },
    { staleRefreshFailures: [{ source: 'example', error: 'HTTP 500' }] },
    { failedPhotos: 1 },
    { error: 'Sitemap unavailable' },
  ]) assert.equal(canPublishCatalogue({ ...completeReport, ...partial }), false, JSON.stringify(partial));
});

const raw = {
  id: 'lyndons-family-id', name: '*** Cement 20kg ',
  categories: [{ name: 'Concreting Products, Cement & Accessories' }, { name: 'Cement' }, { name: 'Bagged cement' }],
};

test('metadata keeps source family and category hierarchy, and exact variant labels', () => {
  const variant = { label: '  Grey — 20 kg  ', sku: 'CEMENT20' };
  const before = structuredClone({ raw, variant });
  assert.deepEqual(productMetadata(raw, variant), {
    familyId: 'lyndons-family-id', familyName: 'Cement 20kg', variantLabel: variant.label,
    categoryPath: raw.categories.map(category => category.name), subcategory: 'Bagged cement',
    pack: variant.label, packStatus: 'source-variant',
  });
  assert.deepEqual({ raw, variant }, before);
});

test('no subcategory is invented for a top-level or absent source category', () => {
  for (const categories of [[], [{ name: 'Tools & Accessories' }]]) {
    const metadata = productMetadata({ ...raw, categories }, { label: '' });
    assert.equal(metadata.subcategory, '');
    assert.deepEqual(metadata.categoryPath, categories.map(category => category.name));
  }
});

test('weight or unit-like titles never replace the existing pack fallback', () => {
  for (const name of ['Cement 20kg bag', 'Sand 1 tonne', 'Screws box of 100', 'Sealant 600ml']) {
    for (const variant of [{ label: '' }, {}]) {
      const metadata = productMetadata({ ...raw, name }, variant);
      assert.equal(metadata.variantLabel, '');
      assert.equal(metadata.pack, 'Pack / unit: confirm with branch');
      assert.equal(metadata.packStatus, 'branch-confirmation-required');
    }
  }
});

test('colour and size variants stay source labels, not inferred buying units', () => {
  for (const label of ['Blue', '7mm', '20 kg']) {
    const metadata = productMetadata(raw, { label });
    assert.equal(metadata.variantLabel, label);
    assert.equal(metadata.pack, label);
    assert.equal(metadata.packStatus, 'source-variant');
    assert.equal(metadata.familyId, raw.id);
  }
});