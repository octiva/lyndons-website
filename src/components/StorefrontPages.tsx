import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, ExternalLink, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { branches, catalogues, categories, productFamilies, products } from '../data/catalog';
import type { Product } from '../data/catalog';
import { searchCatalogue } from '../lib/catalogue-search';
import { defaultFilters, listingHref, productHref, productsByCode } from '../lib/storefront-route';
import type { CatalogueFilters, Navigate, StoreRoute } from '../lib/storefront-route';
import { ProductImage } from './ProductImage';
import { QuantityInput } from './QuantityInput';
import { StorefrontUpdates } from './StorefrontUpdates';

const PAGE_SIZE = 24;
const brandNames = [...new Map(products.map(product => [product.brand.toLowerCase(), product.brand])).values()].sort((a, b) => a.localeCompare(b));
const categoryCounts = new Map(categories.map(category => [category, new Set(products.filter(product => product.category === category).map(product => product.familyId)).size]));
const brandCounts = new Map(brandNames.map(brand => [brand, new Set(products.filter(product => product.brand.toLowerCase() === brand.toLowerCase()).map(product => product.familyId)).size]));
type AddProduct = (id: string, quantity?: number) => void;

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="trade-breadcrumbs" aria-label="Breadcrumb"><a href="#/home">Home</a>{items.map((item, index) => <span key={`${item.label}-${index}`}><span aria-hidden="true">/</span>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</span>)}</nav>;
}

function ProductCard({ product, exact, onAdd }: { product: Product; exact: boolean; onAdd: AddProduct }) {
  const family = productFamilies.get(product.familyId)!;
  const grouped = family.length > 1;
  const name = grouped && !exact ? product.familyName : product.name;
  const href = productHref(product, grouped && !exact);
  return <article className="trade-product-card product-card">
    <a className="trade-product-picture" href={href} aria-label={`View ${name}`}><ProductImage key={product.image} product={product} /></a>
    <div className="trade-product-copy">
      <span className="trade-product-brand">{product.brand}</span>
      <h3><a href={href}>{name}</a></h3>
      <p>{grouped && !exact ? `${family.length} size / colour options` : product.pack}</p>
      <small>{grouped && !exact ? 'Select the required option' : `Code: ${product.sourceSku ?? product.id}`}</small>
      {product.note && <small className="trade-data-note">Details need confirmation</small>}
      <div className="trade-card-action"><span>Price on request</span>{grouped
        ? <a href={href} aria-label={`Choose options for ${product.familyName}`}>Choose options <ArrowRight size={15} /></a>
        : <button type="button" onClick={() => onAdd(product.id)} aria-label={`Add ${product.name} to quote`}>Add to quote <Plus size={15} /></button>}
      </div>
    </div>
  </article>;
}

export function CataloguePage({ route, navigate, onAdd, branch }: { route: StoreRoute; navigate: Navigate; onAdd: AddProduct; branch: string }) {
  const home = route.page === 'home';
  const page = home ? 'home' : 'products';
  const filters = route.filters;
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { q, category, subcategory, brand, sort } = filters;
  const result = useMemo(() => searchCatalogue(q, category, subcategory, brand, sort), [q, category, subcategory, brand, sort]);
  const subcategories = useMemo(() => [...new Set(products.filter(product => category === 'All products' || product.category === category).map(product => product.subcategory).filter(Boolean))].sort(), [category]);
  const pageCount = Math.max(1, Math.ceil(result.families.length / PAGE_SIZE));
  const pageNumber = Math.min(filters.page, pageCount);
  const visible = result.families.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);
  const filtered = q || category !== defaultFilters.category || subcategory || brand !== defaultFilters.brand || sort !== defaultFilters.sort;
  const currentBranch = branches.find(item => item.name === branch)!;

  useEffect(() => {
    // Sanitise stale/out-of-range deep links without adding a history entry.
    if (filters.page !== pageNumber) navigate(listingHref(page, { ...filters, page: pageNumber }), { replace: true, focus: 'none' });
  }, [filters, navigate, page, pageNumber]);

  function refine(changes: Partial<CatalogueFilters>) {
    navigate(listingHref(page, { ...filters, ...changes, page: 1 }), { focus: 'none' });
  }
  function paginate(number: number) {
    navigate(listingHref(page, { ...filters, page: number }), { focus: 'results' });
  }
  function toggleFilters() {
    setFiltersExpanded(value => !value);
    if (!filtersExpanded) requestAnimationFrame(() => {
      const panel = document.getElementById('product-filters');
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }

  const results = <section className="trade-results" aria-label="Product results">
    <div className="trade-results-toolbar">
      <div id="catalogue-results" tabIndex={-1}>
        <h2>{home ? 'Browse products' : 'Products in this range'}</h2>
        <p role="status" aria-live="polite"><strong>{result.families.length.toLocaleString()} products</strong> · {result.matches.length.toLocaleString()} options{q.trim() ? ` matching “${q.trim()}”` : ''}</p>
      </div>
      {!home && <button className="trade-button trade-mobile-filters" type="button" aria-expanded={filtersExpanded} aria-controls="product-filters" onClick={toggleFilters}><SlidersHorizontal size={16} /> Filters & categories</button>}
      <label className="trade-sort">Sort by<select aria-label="Sort products" value={sort} onChange={event => refine({ sort: event.target.value === 'az' ? 'az' : 'featured' })}><option value="featured">Catalogue order</option><option value="az">Name: A–Z</option></select></label>
    </div>
    <form className="trade-search trade-results-search" role="search" aria-label="Search this range" onSubmit={event => {
      event.preventDefault();
      navigate(listingHref(page, { ...filters, q: q.trim(), page: 1 }), { focus: 'results' });
    }}>
      <label className="sr-only" htmlFor="range-search">Search this product range</label>
      <input id="range-search" type="search" placeholder="Search products, brands or product codes" autoComplete="off" maxLength={200} value={q} onChange={event => navigate(listingHref(page, { ...filters, q: event.target.value, page: 1 }), { replace: true, focus: 'none' })} />
      <button type="submit" aria-label="Search this product range"><Search size={21} /></button>
    </form>
    {home && <div className="trade-range-categories" aria-label="Product categories">{categories.slice(0, 5).map(value => <a key={value} href={listingHref('products', { category: value })}>{value}</a>)}<a href="#/categories">All categories <ArrowRight size={14} /></a></div>}
    {filtered && <div className="trade-applied-filters" aria-label="Applied filters">
      {q && <span>Search: {q}</span>}{category !== defaultFilters.category && <span>{category}</span>}{subcategory && <span>{subcategory}</span>}{brand !== defaultFilters.brand && <span>{brand}</span>}
      <a href={listingHref(page)} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(listingHref(page), { focus: 'results' }); } }}>Clear filters</a>
    </div>}
    {result.approximate && <p className="trade-notice" role="status">No exact text match. Showing close matches for “{q}”—check the product name and code before adding.</p>}
    {visible.length ? <div className="trade-product-grid product-grid" id={home ? 'home-product-grid' : 'product-grid'}>{visible.map(product => <ProductCard key={product.familyId} product={product} exact={result.exactSku(product)} onAdd={onAdd} />)}</div>
      : <div className="trade-empty"><Search size={32} /><h3>No products found</h3><p>Try a product name, brand or code in the search above. Not every stocked item is listed online.</p><a className="trade-button" href={listingHref(page)}>Clear filters</a><a href={`tel:${currentBranch.phone.replaceAll(' ', '')}`}>Call {branch} for help</a></div>}
    {pageCount > 1 && <nav className="trade-pagination" aria-label="Catalogue pages">
      {pageNumber > 1 ? <a className="trade-button" href={listingHref(page, { ...filters, page: pageNumber - 1 })} data-route-focus="results">Previous</a> : <button className="trade-button" disabled>Previous</button>}
      <label>Page<select aria-label="Catalogue page" value={pageNumber} onChange={event => paginate(Number(event.target.value))}>{Array.from({ length: pageCount }, (_, index) => <option key={index} value={index + 1}>{index + 1} of {pageCount}</option>)}</select></label>
      {pageNumber < pageCount ? <a className="trade-button trade-primary" href={listingHref(page, { ...filters, page: pageNumber + 1 })} data-route-focus="results">Next <ArrowRight size={16} /></a> : <button className="trade-button trade-primary" disabled>Next <ArrowRight size={16} /></button>}
    </nav>}
    <p className="trade-listing-note"><strong>Public range, not a live stock list.</strong> {products.length.toLocaleString()} product and variant entries from {productFamilies.size.toLocaleString()} Lyndons listings. Imported details and supplier matches need branch confirmation. <a href="#/catalogues">Catalogues & data sheets <ArrowRight size={14} /></a></p>
  </section>;

  return <div className={`trade-wrap trade-page ${home ? 'trade-home' : 'trade-listing'}`}>
    {home ? <><section className="trade-landing-intro"><h1 tabIndex={-1}>Find your building supplies.</h1><p>Use the search above to find products, brands or codes.</p></section><StorefrontUpdates /><div className="trade-home-products">{results}</div></> : <>
      <Breadcrumbs items={[{ label: 'Products', href: category !== defaultFilters.category ? '#/products' : undefined }, ...(category !== defaultFilters.category ? [{ label: category }] : [])]} />
      <div className="trade-page-heading"><div><h1 tabIndex={-1}>{q.trim() ? `Results for “${q.trim()}”` : category}</h1><p>Choose a product for specifications, source documents and size or colour options.</p></div><a href="#/categories">Browse categories <ArrowRight size={16} /></a></div>
      <div className="trade-listing-layout">
        <aside id="product-filters" tabIndex={-1} className={`trade-filters ${filtersExpanded ? 'is-expanded' : ''}`} aria-label="Product filters">
          <h2>Product categories</h2>
          <a className={category === 'All products' ? 'is-active' : ''} aria-current={category === 'All products' ? 'true' : undefined} href={listingHref('products', { ...filters, category: 'All products', subcategory: '', page: 1 })}>All products <span>{productFamilies.size.toLocaleString()}</span></a>
          {categories.map(value => <a key={value} className={category === value ? 'is-active' : ''} aria-current={category === value ? 'true' : undefined} href={listingHref('products', { ...filters, category: value, subcategory: '', page: 1 })}>{value}<span>{categoryCounts.get(value)}</span></a>)}
          <h2>Refine your results</h2>
          <label>Brand<select aria-label="Filter by brand" value={brand} onChange={event => refine({ brand: event.target.value })}><option>All brands</option>{brandNames.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Product type<select aria-label="Narrow by product type" value={subcategory} onChange={event => refine({ subcategory: event.target.value })}><option value="">All product types</option>{subcategories.map(value => <option key={value}>{value}</option>)}</select></label>
          <div className="trade-filter-help"><strong>Not sure which product?</strong><p>Your local team can help.</p><a href="#/branches">Contact your branch <ArrowRight size={14} /></a></div>
        </aside>
        {results}
      </div>
    </>}
  </div>;
}

export function ProductPage({ route, branch, navigate, onAdd }: { route: StoreRoute; branch: string; navigate: Navigate; onAdd: AddProduct }) {
  const product = productsByCode.get(route.sku);
  if (!product) return <NotFound product />;
  return <ProductDetail key={product.familyId} product={product} choose={route.choose} branch={branch} navigate={navigate} onAdd={onAdd} />;
}

function ProductDetail({ product, choose, branch, navigate, onAdd }: { product: Product; choose: boolean; branch: string; navigate: Navigate; onAdd: AddProduct }) {
  const variants = productFamilies.get(product.familyId) ?? [product];
  const selected = !choose || variants.length === 1;
  const [quantity, setQuantity] = useState(1);
  const [validQuantity, setValidQuantity] = useState(true);
  const name = selected ? product.name : product.familyName;
  return <div className="trade-wrap trade-page trade-detail">
    <Breadcrumbs items={[{ label: 'Products', href: '#/products' }, { label: product.category, href: listingHref('products', { category: product.category }) }, { label: name }]} />
    <div className="trade-product-detail">
      <div className="trade-detail-gallery"><div className="trade-large-image"><ProductImage key={product.image} product={product} /></div><small>Source listing photo. Packaging may vary.{variants.length > 1 && ' The photo may show several options; confirm your selected size or colour.'}</small></div>
      <section className="trade-product-order" aria-label="Product selection">
        <span className="trade-product-brand">{product.brand}</span><h1 tabIndex={-1}>{name}</h1>
        <div className="trade-product-ident"><span>{selected ? product.pack : `${variants.length} size / colour options`}</span><span>Product code <strong>{selected ? product.sourceSku ?? product.id : 'Select an option below'}</strong></span></div>
        <p className="trade-detail-description">{product.description}</p>
        {product.note && <p className="trade-notice">{product.note}</p>}
        {product.imported && <p className="trade-provenance"><strong>Imported listing — confirmation required.</strong> Description and brand are as listed by Lyndons. A supplier-library link is not an exact manufacturer/product match. Check current specifications before use.</p>}
        <div className="trade-order-box"><h2>Request a quote</h2><p>Price & availability confirmed by your branch</p>
          <form onSubmit={event => { event.preventDefault(); if (selected && validQuantity) onAdd(product.id, quantity); }}>
            {variants.length > 1 && <label className="trade-variant-picker">Choose size / colour<select required value={selected ? product.id : ''} onChange={event => {
              const variant = variants.find(item => item.id === event.target.value);
              navigate(productHref(variant ?? product, !variant), { replace: true, focus: 'none' });
            }}><option value="">Select an option</option>{variants.map(variant => <option key={variant.id} value={variant.id}>{variant.variantLabel || variant.pack} — {variant.sourceSku ?? variant.id}</option>)}</select></label>}
            <div className="trade-order-actions"><div><label htmlFor="product-quantity">Quantity</label><QuantityInput id="product-quantity" label="Quantity" value={quantity} onChange={setQuantity} onValidityChange={setValidQuantity} /></div><button className="trade-button trade-primary" type="submit" disabled={!selected || !validQuantity}>Add to quote <Plus size={17} /></button></div>
          </form>
          <small>No payment required. Adding a product does not send a request.</small>
        </div>
        <div className="trade-fulfilment"><div><p><strong>Collect from {branch}</strong><small>Confirm availability and timing with the branch</small></p><a href="#/branches">Change branch</a></div><div><p><strong>Delivery to site</strong><small>Ask your branch about delivery options</small></p><a href="#/help">Details</a></div></div>
      </section>
    </div>
    <div className="trade-product-information">
      <section><h2>Product information</h2><dl>
        <div><dt>Brand as listed</dt><dd>{product.brand}</dd></div><div><dt>Manufacturer / brand</dt><dd>{product.manufacturer}</dd></div>
        <div><dt>Listed size / pack</dt><dd>{selected ? product.pack : 'Select an option above'}</dd></div><div><dt>Lyndons reference</dt><dd>{selected ? product.sourceSku ?? product.id : 'Select an option above'}</dd></div>
        <div><dt>Product type</dt><dd>{product.subcategory || product.category}</dd></div>
      </dl><p className="trade-subtle">Confirm the current specification, ordering unit and suitability before ordering. No stock status is implied.</p></section>
      <section><h2>Documents & supplier information</h2><div className="trade-source-links">
        <a href={product.source} target="_blank" rel="noreferrer">Original product listing <ExternalLink size={15} /></a>
        {product.supplier ? <a href={product.supplier} target="_blank" rel="noreferrer">Supplier information <ExternalLink size={15} /></a> : <p className="trade-subtle">No supplier resource is recorded for this listing. Ask the branch for current technical and safety data.</p>}
        {product.imageSource && <a href={product.imageSource} target="_blank" rel="noreferrer">Original product photo <ExternalLink size={15} /></a>}
        <a href="#/catalogues">Catalogues & data sheets <ArrowRight size={15} /></a>
      </div><small>Source checked {product.verified}. Supplier libraries are not proof of an exact product or manufacturer match.</small></section>
    </div>
  </div>;
}

export function CategoriesPage() {
  return <div className="trade-wrap trade-page"><Breadcrumbs items={[{ label: 'Categories' }]} /><div className="trade-page-heading"><div><h1 tabIndex={-1}>Product categories</h1><p>Browse the collected public range by category.</p></div><a href="#/products">All products <ArrowRight size={16} /></a></div><div className="trade-category-directory">{categories.map(category => {
    const product = products.find(item => item.category === category && item.image);
    return <a key={category} href={listingHref('products', { category })}>{product && <ProductImage product={product} />}<span><strong>{category}</strong><small>{categoryCounts.get(category)?.toLocaleString()} products</small></span><ArrowRight size={18} /></a>;
  })}</div></div>;
}

export function CataloguesPage() {
  const local = catalogues.filter(item => item.url.startsWith(import.meta.env.BASE_URL));
  const libraries = catalogues.filter(item => !local.includes(item));
  const archived = local.filter(item => item.tag.includes('HISTORICAL'));
  const current = local.filter(item => !archived.includes(item));
  function documents(items: typeof catalogues) {
    return <div className="trade-document-table">{items.map(item => <article key={item.url}>
      <span className="trade-file-type">{item.url.endsWith('.csv') ? 'CSV' : item.url.endsWith('.json') ? 'JSON' : item.url.endsWith('.pdf') ? 'PDF' : 'WEB'}</span>
      <div><small>{item.tag}</small><h3>{item.title}</h3><strong>{item.subtitle}</strong><p>{item.description}</p></div>
      <a href={item.url} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`}>View <ExternalLink size={15} /></a>
      {local.includes(item) && <a href={item.url} download aria-label={`Download ${item.title}`}>Download <Download size={15} /></a>}
    </article>)}</div>;
  }
  return <div className="trade-wrap trade-page"><Breadcrumbs items={[{ label: 'Catalogues & data sheets' }]} /><div className="trade-page-heading"><div><h1 tabIndex={-1}>Catalogues & data sheets</h1><p>Product references, supplier libraries and company information.</p></div></div>
    <p className="trade-notice">No complete, current Lyndons PDF catalogue has been verified. The public product list is not a complete stocked inventory. Always check current technical and safety data.</p>
    <section className="trade-document-section"><h2>Product list, supplier catalogue & company documents</h2>{documents(current)}</section>
    <section className="trade-document-section"><h2>Supplier catalogues & technical libraries</h2><p>These links open supplier websites. Confirm the exact product, version and suitability before use.</p>{documents(libraries)}</section>
    <section className="trade-document-section"><h2>Archived offers — expired</h2><p>The November 2022 document is a four-page promotional flyer, not the full catalogue. Its prices are not current.</p>{documents(archived)}</section>
  </div>;
}

export function BrandsPage() {
  return <div className="trade-wrap trade-page"><Breadcrumbs items={[{ label: 'Brands' }]} /><div className="trade-page-heading"><div><h1 tabIndex={-1}>Brands</h1><p>Brand names as recorded in the public Lyndons listings. Manufacturer identities are not all independently verified.</p></div></div><div className="trade-brand-directory">{brandNames.map(brand => <a key={brand} href={listingHref('products', { brand })}><strong>{brand}</strong><span>{brandCounts.get(brand)?.toLocaleString()} products <ArrowRight size={16} /></span></a>)}</div><p className="trade-listing-note">“Brand not listed” and “Manufacturer to confirm” indicate missing information, not supplier brands. No exclusive supplier relationship is implied.</p></div>;
}

export function BranchesPage({ branch, setBranch }: { branch: string; setBranch: (branch: string) => void }) {
  return <div className="trade-wrap trade-page"><Breadcrumbs items={[{ label: 'Branches' }]} /><div className="trade-page-heading"><div><h1 tabIndex={-1}>Your local Lyndons</h1><p>{branches.length} Queensland branches. Contact the team for product, collection and delivery enquiries.</p><p role="status">Your selected branch: <strong>{branch}</strong></p></div></div><div className="trade-branch-grid">{branches.map(item => <article key={item.name} className={branch === item.name ? 'is-selected' : ''}><h2>Lyndons {item.name}</h2><a className="trade-branch-phone" href={`tel:${item.phone.replaceAll(' ', '')}`}>{item.phone}</a><a href={`mailto:${item.email}`}>{item.email}</a><p>Check the branch page for the current address, trading hours and services.</p><div><button className={`trade-button ${branch === item.name ? '' : 'trade-primary'}`} type="button" aria-pressed={branch === item.name} onClick={() => setBranch(item.name)}>{branch === item.name ? 'Selected branch' : 'Choose this branch'}</button><a href={item.url} target="_blank" rel="noreferrer">Address & hours <ExternalLink size={15} /></a></div></article>)}</div></div>;
}

export function HelpPage() {
  return <div className="trade-wrap trade-page trade-help"><Breadcrumbs items={[{ label: 'Delivery & help' }]} /><div className="trade-page-heading"><div><h1 tabIndex={-1}>Delivery & help</h1><p>Prepare a product list, then confirm the details with your local branch.</p></div></div>
    <details open><summary>How does a quote work?</summary><p>Add products and quantities to <a href="#/quote">your quote list</a>, choose your branch and enter your contact and job details. Review, download or copy the request, then open an email draft. Check it, attach the request when instructed and press Send yourself. Nothing is sent automatically and no order is placed.</p></details>
    <details><summary>Can I collect from a branch?</summary><p>Choose your preferred branch and ask the team to confirm availability and collection timing. A product appearing in this public catalogue does not mean it is in stock.</p></details>
    <details><summary>Can you deliver to a job site?</summary><p>Select delivery in your quote details. Include the site address, access restrictions, required date and unloading arrangements in your notes. Delivery charges and timing need branch confirmation.</p><a href="https://lyndons.com.au/customer-service/delivery" target="_blank" rel="noreferrer">Lyndons delivery information <ExternalLink size={15} /></a></details>
    <details><summary>What if a product is not listed?</summary><p>The public catalogue is not the full stocked inventory. Add the product name, size and quantity to the job notes on an existing quote, or contact your branch directly if you only need unlisted products.</p></details>
    <details><summary>Where can I find product documents?</summary><p>Product detail pages link to their original listing and recorded supplier resources. The <a href="#/catalogues">catalogue library</a> includes downloaded documents and technical libraries. Supplier links do not independently verify an exact manufacturer match.</p></details>
    <details><summary>What is saved on this device?</summary><p>Only product IDs, quantities and your branch preference are saved in browser storage. Contact and job details stay in this tab’s memory while you move between pages. Reloading, closing or locking the preview clears those details. Download your request before leaving. The client-side preview gate is not secure authentication.</p></details>
    <a className="trade-button trade-primary" href="#/branches">Contact a branch <ArrowRight size={16} /></a>
  </div>;
}

export function NotFound({ product = false }: { product?: boolean }) {
  return <div className="trade-wrap trade-page trade-empty"><h1 tabIndex={-1}>{product ? 'Product not found' : 'Page not found'}</h1><p>{product ? 'This product code is not in the collected public range. Check the code or contact your branch.' : 'This address does not match a page in the catalogue.'}</p><a className="trade-button trade-primary" href="#/products">Browse products <ArrowRight size={16} /></a><a href="#/branches">Contact a branch</a></div>;
}