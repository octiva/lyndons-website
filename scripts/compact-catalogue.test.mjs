import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compactCatalogue, expandCatalogue } from './lib/compact-catalogue.mjs';
test('compact catalogue retains every SKU, description, source and variant without drift', async () => {
  const original = JSON.parse(await readFile(new URL('../src/data/generated/products.json', import.meta.url), 'utf8'));
  const compact = compactCatalogue(original);
  // Null/undefined metadata is absent in expanded rows; meaningful fields are identical.
  const clean = rows => rows.map(row => Object.fromEntries(Object.entries(row).filter(([,v]) => v != null)));
  assert.deepEqual(expandCatalogue(compact), clean(original));
  assert.ok(JSON.stringify(compact).length < JSON.stringify(original).length * 0.6);
  const published = JSON.parse(await readFile(new URL('../src/data/generated/catalogue-compact.json', import.meta.url), 'utf8'));
  assert.deepEqual(expandCatalogue(published), clean(original));
});