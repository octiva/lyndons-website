import { readFile, writeFile } from 'node:fs/promises';
import { compactCatalogue } from './lib/compact-catalogue.mjs';
const input = new URL('../src/data/generated/products.json', import.meta.url);
const products = JSON.parse(await readFile(input, 'utf8'));
const data = JSON.stringify(compactCatalogue(products));
await writeFile(new URL('../src/data/generated/catalogue-compact.json', import.meta.url), data);
console.log(`Compacted ${products.length} SKUs into ${data.length.toLocaleString()} characters; original details retained.`);