import Fuse from 'fuse.js';
import { products } from '../data/catalog';
import type { Product } from '../data/catalog';

export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
const synonyms: Record<string, string> = { reo: 'reinforcing', ppe: 'safety', cement: 'cement', 'wheel barrow': 'wheelbarrow', 'zip ties': 'cable ties' };
const records = products.map(product => ({ product, text: normalizeSearch([product.name, product.brand, product.id, product.sourceSku, product.description, product.category, ...product.categoryPath].join(' ')) }));
const fuzzy = new Fuse(products, { keys: [{ name: 'name', weight: 3 }, 'brand', 'subcategory'], threshold: 0.28, ignoreLocation: true, minMatchCharLength: 3 });
export function searchCatalogue(query: string, category: string, subcategory: string, brand: string, sort: string) {
  const normalized = normalizeSearch(query);
  const expanded = synonyms[normalized] ?? normalized;
  const matchFilter = (p: Product) => (category === 'All products' || p.category === category) && (!subcategory || p.subcategory === subcategory) && (brand === 'All brands' || p.brand.toLowerCase() === brand.toLowerCase());
  const terms = normalized.split(/\s+/).filter(Boolean);
  const aliasTerms = expanded.split(/\s+/).filter(Boolean);
  let matches = records.filter(({ product, text }) => matchFilter(product) && (terms.every(term => text.includes(term)) || aliasTerms.every(term => text.includes(term)))).map(({ product }) => product);
  let approximate = false;
  if (!matches.length && normalized.length >= 4) {
    matches = fuzzy.search(normalized).map(result => result.item).filter(matchFilter);
    approximate = matches.length > 0;
  }
  const exactSku = (p: Product) => !!normalized && [p.id, p.sourceSku ?? ''].some(code => normalizeSearch(code) === normalized);
  matches.sort((a, b) => Number(exactSku(b)) - Number(exactSku(a)) || (sort === 'az' ? a.familyName.localeCompare(b.familyName) : 0));
  const grouped = new Map<string, Product>();
  for (const p of matches) if (!grouped.has(p.familyId)) grouped.set(p.familyId, p);
  const families = [...grouped.values()];
  // Prefer the exact SKU when multiple matching variants share a family.
  for (const p of matches.filter(exactSku)) {
    const index = families.findIndex(f => f.familyId === p.familyId);
    if (index >= 0) families[index] = p;
  }
  return { matches, families, approximate, exactSku };
}