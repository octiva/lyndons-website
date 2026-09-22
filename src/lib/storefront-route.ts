import { useEffect, useRef, useState } from 'react';
import { categories, products } from '../data/catalog';
import type { Product } from '../data/catalog';

export type StorePage = 'home' | 'products' | 'categories' | 'product' | 'catalogues' | 'brands' | 'branches' | 'help' | 'quote' | 'not-found';
export interface CatalogueFilters {
  q: string;
  category: string;
  subcategory: string;
  brand: string;
  sort: 'featured' | 'az';
  page: number;
}
export interface StoreRoute {
  page: StorePage;
  filters: CatalogueFilters;
  sku: string;
  choose: boolean;
}
export const defaultFilters: CatalogueFilters = { q: '', category: 'All products', subcategory: '', brand: 'All brands', sort: 'featured', page: 1 };
export const productsByCode = new Map<string, Product>();
for (const product of products) {
  productsByCode.set(product.id, product);
  if (product.sourceSku) productsByCode.set(product.sourceSku, product);
}
const brandNames = new Map(products.map(product => [product.brand.toLowerCase(), product.brand]));
const pageNames: StorePage[] = ['home', 'products', 'categories', 'product', 'catalogues', 'brands', 'branches', 'help', 'quote'];
const legacy: Record<string, string> = { resources: 'catalogues', 'how-it-works': 'help' };

export function listingHref(page: 'home' | 'products', filters: Partial<CatalogueFilters> = {}) {
  const values = { ...defaultFilters, ...filters };
  const params = new URLSearchParams();
  if (values.q) params.set('q', values.q);
  if (values.category !== defaultFilters.category) params.set('category', values.category);
  if (values.subcategory) params.set('subcategory', values.subcategory);
  if (values.brand !== defaultFilters.brand) params.set('brand', values.brand);
  if (values.sort !== defaultFilters.sort) params.set('sort', values.sort);
  if (values.page > 1) params.set('page', String(values.page));
  return `#/${page}${params.size ? `?${params}` : ''}`;
}

// A generic family card explicitly asks for a choice. A bare SKU URL always
// identifies that exact option, including when opened in a new tab.
export function productHref(product: Product, choose = false) {
  return `#/product/${encodeURIComponent(product.sourceSku ?? product.id)}${choose ? '?choose=1' : ''}`;
}

export function parseStoreRoute(hash: string): StoreRoute {
  const raw = hash.replace(/^#\/?/, '');
  const separator = raw.indexOf('?');
  const path = separator < 0 ? raw : raw.slice(0, separator);
  const params = new URLSearchParams(separator < 0 ? '' : raw.slice(separator + 1));
  const [section = '', encodedSku = '', ...rest] = path.split('/');
  const mapped = legacy[section] ?? (section || 'home');
  const page: StorePage = pageNames.includes(mapped as StorePage) && !rest.length && (mapped === 'product' || !encodedSku) ? mapped as StorePage : 'not-found';
  let sku = '';
  try { sku = decodeURIComponent(encodedSku); } catch { /* An invalid escape resolves to product not found. */ }
  const category = categories.find(value => value === params.get('category')) ?? defaultFilters.category;
  const requestedSubcategory = params.get('subcategory') ?? params.get('type') ?? '';
  const subcategory = requestedSubcategory && products.some(product => product.subcategory === requestedSubcategory && (category === defaultFilters.category || product.category === category)) ? requestedSubcategory : '';
  const pageValue = Number(params.get('page') ?? 1);
  return {
    page, sku, choose: page === 'product' && params.get('choose') === '1',
    filters: {
      q: (params.get('q') ?? '').slice(0, 200), category, subcategory,
      brand: brandNames.get((params.get('brand') ?? '').toLowerCase()) ?? defaultFilters.brand,
      sort: params.get('sort') === 'az' ? 'az' : 'featured',
      page: Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    },
  };
}

function canonicalHash(route: StoreRoute) {
  if (route.page === 'home' || route.page === 'products') return listingHref(route.page, route.filters);
  if (route.page === 'product') {
    const product = productsByCode.get(route.sku);
    return product ? productHref(product, route.choose) : `#/product/${encodeURIComponent(route.sku)}`;
  }
  return route.page === 'not-found' ? location.hash : `#/${route.page}`;
}

export type RouteFocus = 'page' | 'results' | 'none' | 'restore';
export interface NavigationOptions { replace?: boolean; focus?: RouteFocus }
export type Navigate = (href: string, options?: NavigationOptions) => void;
let nextEntry = 0;
function entryId() { return `trade-${Date.now()}-${++nextEntry}`; }
function stateWithEntry(id: string) { return { ...history.state, tradeEntry: id }; }

export function useStorefrontRoute() {
  const [navigation, setNavigation] = useState(() => ({ route: parseStoreRoute(location.hash), revision: 0, focus: 'page' as RouteFocus, scroll: 0 }));
  const currentHash = useRef(location.hash);
  const currentEntry = useRef('');
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    currentEntry.current = history.state?.tradeEntry ?? entryId();
    const canonical = canonicalHash(parseStoreRoute(location.hash));
    history.replaceState(stateWithEntry(currentEntry.current), '', canonical);
    currentHash.current = canonical;
    const remember = () => positions.current.set(currentEntry.current, window.scrollY);
    const changed = () => {
      if (location.hash === currentHash.current && history.state?.tradeEntry === currentEntry.current) return;
      const route = parseStoreRoute(location.hash);
      const id = history.state?.tradeEntry ?? entryId();
      const scroll = positions.current.get(id);
      currentEntry.current = id;
      currentHash.current = canonicalHash(route);
      history.replaceState(stateWithEntry(id), '', currentHash.current);
      setNavigation(previous => ({ route, revision: previous.revision + 1, focus: scroll === undefined ? 'page' : 'restore', scroll: scroll ?? 0 }));
    };
    window.addEventListener('scroll', remember, { passive: true });
    window.addEventListener('hashchange', changed);
    window.addEventListener('popstate', changed);
    return () => {
      window.removeEventListener('scroll', remember);
      window.removeEventListener('hashchange', changed);
      window.removeEventListener('popstate', changed);
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  const navigate: Navigate = (href, options = {}) => {
    const route = parseStoreRoute(href);
    const canonical = canonicalHash(route);
    positions.current.set(currentEntry.current, window.scrollY);
    const id = options.replace ? currentEntry.current : entryId();
    if (canonical !== location.hash) {
      history[options.replace ? 'replaceState' : 'pushState'](stateWithEntry(id), '', canonical);
      currentEntry.current = id;
      currentHash.current = canonical;
    }
    setNavigation(previous => ({ route, revision: previous.revision + 1, focus: options.focus ?? 'page', scroll: window.scrollY }));
  };
  return { ...navigation, navigate };
}