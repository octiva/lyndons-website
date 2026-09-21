import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDown, ArrowRight, CheckCircle2, ChevronDown, ClipboardList, ExternalLink, FileText, Hammer, HardHat, Layers3, LockKeyhole, MapPin, Menu, Package, Phone, Plus, Search, ShieldCheck, SlidersHorizontal, Truck, X } from 'lucide-react';
import { branches, catalogues, categories, products, productFamilies } from './data/catalog';
import { searchCatalogue } from './lib/catalogue-search';
import type { Category, Product } from './data/catalog';
import { emptyDetails, hasRetiredCartItems, loadCart } from './lib/quote';
import type { CartLine, QuoteDetails } from './lib/quote';
import { ProductImage } from './components/ProductImage';
import { ProductDialog } from './components/ProductDialog';
import { Brand } from './components/PreviewGate';
import { asset } from './lib/preview';
import { QuotePage } from './components/QuotePage';
import './App.css';
const categoryIcons = [Layers3, Hammer, ShieldCheck, HardHat, Package];
const brandNames = [...new Map(products.map(p => [p.brand.toLowerCase(), p.brand])).values()].sort();
const PAGE_SIZE = 24;
const howSteps = [{ icon: Search, title: 'Find your supplies', text: 'Search by product, brand or code. Check the photos and details, then add what you need.' }, { icon: ClipboardList, title: 'Build your quote list', text: 'Set your quantities and choose collection or delivery. Add any products you can’t find.' }, { icon: HardHat, title: 'Talk to your local team', text: 'Share your request with a branch. They’ll confirm price, availability and the next steps.' }];
function App({ onLock }: { onLock: () => void }) {
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [storageError, setStorageError] = useState(false);
  const [retiredCartItems] = useState(hasRetiredCartItems);
  const [page, setPage] = useState(window.location.hash === '#quote' ? 'quote' : 'home');
  const [details, setDetails] = useState<QuoteDetails>(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('lyndons-branch'); } catch { /* Memory-only preference. */ }
    return { ...emptyDetails, branch: branches.some(b => b.name === saved) ? saved! : 'Windsor' };
  });
  const branch = details.branch;
  function setBranch(value: string) { setDetails(d => ({ ...d, branch: value })); }
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All products'>('All products'); const [brand, setBrand] = useState('All brands'); const [sort, setSort] = useState('featured');
  const [selected, setSelected] = useState<Product | null>(null); const [toast, setToast] = useState(''); const [menu, setMenu] = useState(false);
  const [pagination, setPagination] = useState({ key: '', index: 0 });
  const [subcategory, setSubcategory] = useState('');
  const [exactSelection, setExactSelection] = useState(false);
  const dirtyDetails = [details.name, details.email, details.phone, details.company, details.address, details.date, details.notes, details.account].some(value => value.trim());
  useEffect(() => {
    if (!dirtyDetails) return;
    // Some browsers emit beforeunload for a download even though this tab remains.
    // Allow only the next download-related event; genuine navigation still warns.
    let downloadUntil = 0;
    const download = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[download]')) downloadUntil = Date.now() + 1000;
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (Date.now() < downloadUntil) { downloadUntil = 0; return; }
      event.preventDefault(); event.returnValue = '';
    };
    document.addEventListener('click', download, true);
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', download, true); };
  }, [dirtyDetails]);
  useEffect(() => { try { localStorage.setItem('lyndons-quote-v1', JSON.stringify(cart)); } catch {
    // This effect synchronises with external browser storage; report write failure.
    // oxlint-disable-next-line react/set-state-in-effect
    setStorageError(true);
  } }, [cart]);
  useEffect(() => { try { localStorage.setItem('lyndons-branch', branch); } catch { /* Branch remains available in memory. */ } }, [branch]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const listener = () => { setPage(location.hash === '#quote' ? 'quote' : 'home'); setMenu(false); }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, []);
  const total = cart.reduce((sum, line) => sum + line.quantity, 0); const currentBranch = branches.find(b => b.name === branch)!;
  const searchResult = useMemo(() => searchCatalogue(query, category, subcategory, brand, sort), [query, category, subcategory, brand, sort]);
  const filtered = searchResult.families;
  const subcategories = useMemo(() => [...new Set(products.filter(p => category === 'All products' || p.category === category).map(p => p.subcategory).filter(Boolean))].sort(), [category]);
  const filterKey = JSON.stringify([query, category, subcategory, brand, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageIndex = pagination.key === filterKey ? Math.min(pagination.index, pageCount - 1) : 0;
  const visibleProducts = filtered.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
  function changePage(index: number) { setPagination({ key: filterKey, index }); document.getElementById('catalogue-results')?.focus(); document.getElementById('catalogue-results')?.scrollIntoView({ behavior: 'auto' }); }
  function chooseCategory(value: string) { setCategory(value); setSubcategory(''); setBrand('All brands'); }
  function openProduct(product: Product) { setExactSelection(searchResult.exactSku(product)); setSelected(product); }
  function go(hash: string) { setMenu(false); setPage(hash === 'quote' ? 'quote' : 'home'); window.location.hash = hash; if (hash === 'quote') { setDetails(d => ({ ...d, branch })); window.scrollTo(0, 0); } else setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 40); }
  function add(id: string, quantity = 1) { setCart(previous => { const existing = previous.find(l => l.id === id); return existing ? previous.map(l => l.id === id ? { ...l, quantity: Math.min(9999, l.quantity + quantity) } : l) : [...previous, { id, quantity }]; }); setToast(`${products.find(p => p.id === id)!.name} added to your quote`); }
  function reset() { setQuery(''); chooseCategory('All products'); }
  function search(event: FormEvent) { event.preventDefault(); if (event.currentTarget instanceof HTMLFormElement && event.currentTarget.classList.contains('header-search')) chooseCategory('All products'); go('products'); }
  function lockPreview() {
    if (dirtyDetails && !window.confirm('Lock this preview and discard your contact/job details? Your product list will stay saved.')) return;
    onLock();
  }
  return <><a className="skip-link" href="#main">Skip to content</a><div className="utility"><div className="container"><span>Building supplies. Local know-how.</span><span><Truck size={15} /> Site delivery & branch collection <span className="utility-divider">|</span> <span className="preview-label">Design preview</span></span></div></div>
    <header className="header"><div className="container header-main"><a href="#home" onClick={() => go('home')} aria-label="Lyndons home"><Brand /></a><form className="header-search" role="search" aria-label="Site search" onSubmit={search}><Search size={20} /><input aria-label="Search products" placeholder="Search products, brands or product codes" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit" aria-label="Find products"><ArrowRight size={20} /></button></form><div className="branch-control"><MapPin size={22} /><label>Your local branch<select aria-label="Your local branch" value={branch} onChange={e => setBranch(e.target.value)}>{branches.map(b => <option key={b.name}>{b.name}</option>)}</select></label></div><button className="quote-button" onClick={() => go('quote')} aria-label={`Your quote, ${total} items`}><ClipboardList size={21} /><span>Your quote</span><b>{total}</b></button><button className="icon-button mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div><nav className={`navigation ${menu ? 'open' : ''}`} aria-label="Main navigation"><div className="container"><div><a href="#products" onClick={e => { e.preventDefault(); go('products'); }}><Menu size={17} /> Shop products <ChevronDown size={14} /></a><a href="#how-it-works" onClick={e => { e.preventDefault(); go('how-it-works'); }}>How quoting works</a><a href="#resources" onClick={e => { e.preventDefault(); go('resources'); }}>Catalogues & guides</a><a href="#branches" onClick={e => { e.preventDefault(); go('branches'); }}>Find a branch</a></div><a className="nav-phone" href={`tel:${currentBranch.phone.replaceAll(' ', '')}`}><Phone size={15} /> {currentBranch.phone}</a></div></nav></header>
    {storageError && <p role="status" className="notice container">Your browser can’t save this quote list. Keep this tab open and download your request before leaving.</p>}
    {retiredCartItems && <p role="status" className="notice container">Some older preview items need to be selected again and were removed from your saved list. For PolyGlow, choose the required colour before adding it. No size or colour was selected automatically.</p>}
    <main id="main">{page === 'quote' ? <QuotePage cart={cart} setCart={setCart} details={details} setDetails={setDetails} onBrowse={() => go('products')} /> : <>
      <section className="hero" id="home"><div className="container hero-content"><div className="hero-copy"><span className="eyebrow light"><span className="little-line" /> YOUR PARTNER ON THE JOB</span><h1>The right supplies.<br /><span>Less running around.</span></h1><p>From the first pour to the finishing touches.<br className="desktop-break" /> Find what you need. Build your list. We’ll sort the quote.</p><div className="hero-actions"><button className="button yellow" onClick={() => go('products')}>Find your products <ArrowRight size={18} /></button><button className="hero-link" onClick={() => go('how-it-works')}>How it works <ArrowDown size={16} /></button></div><div className="hero-note"><CheckCircle2 size={17} /> No checkout hassle. No online payment.</div></div><div className="hero-photo"><img src={asset('images/construction.webp')} alt="Construction crew working on a concrete pour" width="712" height="452" fetchPriority="high" /><div className="photo-label"><HardHat size={25} /><div><strong>Built for the trade.</strong><span>Backed by your local team.</span></div></div><span className="photo-corner">LET’S GET TO WORK.</span></div></div></section>
      <div className="benefits"><div className="container"><div><MapPin /><span><strong>12 Queensland branches</strong><small>Local people who know the job</small></span></div><div><Truck /><span><strong>Collect or get it delivered</strong><small>Talk to us about your site</small></span></div><div><ClipboardList /><span><strong>Your list. Your quote.</strong><small>Pricing confirmed by your branch</small></span></div></div></div>
      <section id="products" className="container catalogue-section"><div className="section-heading"><div><span className="eyebrow">GET WHAT YOU NEED</span><h2>Supplies for the job ahead.</h2></div><a href="#resources" className="text-button">Catalogues & downloads <ArrowRight size={17} /></a></div><div className="category-tiles">{categories.slice(0, 5).map((cat, i) => { const Icon = categoryIcons[i]; return <button key={cat} className={category === cat ? 'active' : ''} aria-pressed={category === cat} onClick={() => chooseCategory(category === cat ? 'All products' : cat)}><Icon size={27} strokeWidth={1.5} /><span>{cat}</span><ArrowRight size={16} /></button>; })}</div>
      <div className="catalogue-layout"><aside className="catalogue-sidebar"><h3>Browse products</h3><button className={category === 'All products' ? 'selected' : ''} onClick={() => chooseCategory('All products')}>All products <span>{productFamilies.size}</span></button>{categories.map(cat => <button className={category === cat ? 'selected' : ''} key={cat} onClick={() => chooseCategory(cat)}>{cat}<span>{new Set(products.filter(p => p.category === cat).map(p => p.familyId)).size}</span></button>)}<div className="sidebar-help"><HardHat size={28} /><h3>Not sure what you need?</h3><p>Talk it through with someone who knows the trade.</p><a href={`tel:${currentBranch.phone.replaceAll(' ', '')}`}><Phone size={15} /> Call {branch}</a></div></aside>
      <div className="product-results" id="catalogue-results" tabIndex={-1}>
        <div className="filter-bar"><form className="catalogue-search" onSubmit={search} role="search" aria-label="Catalogue search"><Search size={18} /><input aria-label="Search this catalogue" placeholder="Find a product or code…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={17} /></button>}</form><label className="brand-filter"><SlidersHorizontal size={16} /><span className="sr-only">Filter by brand</span><select value={brand} onChange={e => setBrand(e.target.value)}><option>All brands</option>{brandNames.map(b => <option key={b}>{b}</option>)}</select></label></div>
        <div className="all-categories">
          <label htmlFor="category-select">Browse all categories</label>
          <select id="category-select" aria-label="Browse all categories" value={category} onChange={e => chooseCategory(e.target.value)}>
            <option>All products</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {category !== 'All products' && subcategories.length > 0 && <div className="all-categories"><label htmlFor="subcategory-select">Narrow by product type</label><select id="subcategory-select" value={subcategory} onChange={e => setSubcategory(e.target.value)}><option value="">All product types</option>{subcategories.map(c => <option key={c}>{c}</option>)}</select></div>}
        <div className="results-heading"><p aria-live="polite"><strong>{category === 'All products' ? 'Explore the range' : category}</strong><span>{filtered.length.toLocaleString()} products · {searchResult.matches.length.toLocaleString()} options</span></p><label><span className="sr-only">Sort products</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Featured</option><option value="az">Name: A–Z</option></select></label></div>
        {searchResult.approximate && <p className="notice" role="status">No exact text match. Showing close matches for “{query}”—check the name and code before adding.</p>}
        {(category !== 'All products' || query || brand !== 'All brands' || subcategory) && <button className="clear-filters" onClick={reset}><X size={14} /> Clear filters</button>}
        {filtered.length ? <div className="product-grid">{visibleProducts.map((product, index) => {
          const family = productFamilies.get(product.familyId)!;
          const grouped = family.length > 1;
          const displayName = grouped && !searchResult.exactSku(product) ? product.familyName : product.name;
          return <article className="product-card" key={product.familyId}>
            <button className="product-photo" onClick={() => openProduct(product)} aria-label={`View ${displayName}`}><ProductImage product={product} />{index === 0 && pageIndex === 0 && !query && category === 'All products' && <span className="product-tag">JOB-SITE ESSENTIAL</span>}</button>
            <div className="product-card-body"><span className="product-brand">{product.brand}</span><button className="product-title" onClick={() => openProduct(product)}>{displayName}</button>
              <p className="product-pack">{grouped ? `${family.length} size / colour options` : product.pack}</p><p className="product-description">{product.description}</p>
              {product.note && <span className="data-note">Details need confirmation</span>}
              <div className="card-bottom"><span>Price on request</span><button onClick={() => grouped ? openProduct(product) : add(product.id)} aria-label={grouped ? `Choose options for ${product.familyName}` : `Add ${product.name} to quote`}><Plus size={17} /> {grouped ? 'Choose options' : 'Add to quote'}</button></div>
            </div>
          </article>;
        })}</div> : <div className="no-results"><Search size={36} /><h3>No products found</h3><p>Try a product name, brand or code. Not every stocked item is listed online.</p><button className="button outline" onClick={reset}>Clear filters</button><a href={`tel:${currentBranch.phone.replaceAll(' ', '')}`}>Or call {branch} for help</a></div>}
      {pageCount > 1 && <nav className="pagination" aria-label="Catalogue pages"><button className="button outline" disabled={pageIndex === 0} onClick={() => changePage(pageIndex - 1)}>Previous</button><label>Page<select aria-label="Catalogue page" value={pageIndex} onChange={e => changePage(Number(e.target.value))}>{Array.from({ length: pageCount }, (_, i) => <option key={i} value={i}>{i + 1} of {pageCount}</option>)}</select></label><button className="button primary" disabled={pageIndex === pageCount - 1} onClick={() => changePage(pageIndex + 1)}>Next <ArrowRight size={16} /></button></nav>}
      <div className="range-note"><FileText size={22} /><p><strong>Public range, not a live stock list.</strong> {products.length.toLocaleString()} product and variant entries collected from 2,061 Lyndons listings. Imported details and supplier matches still need branch confirmation. Can’t find it? Add it to your quote notes.</p><a href="#resources" aria-label="View catalogues"><ArrowRight size={21} /></a></div></div></div></section>
      <section id="how-it-works" className="how-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">FROM YOUR LIST TO YOUR JOB SITE</span><h2>A quote, without the runaround.</h2></div><span className="muted">Three simple steps. No payment required.</span></div><div className="how-grid">{howSteps.map(({ icon: Icon, title, text }, i) => <article key={title}><span className="how-number">0{i + 1}</span><Icon size={27} /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section id="resources" className="container resources-section"><div className="section-heading"><div><span className="eyebrow">THE DETAILS THAT MATTER</span><h2>Catalogues & product guides.</h2></div></div><div className="resource-grid">{catalogues.map(c => <a key={c.title} href={c.url} target="_blank" rel="noreferrer" className="resource-card"><div><FileText size={25} /><ExternalLink size={16} /></div><span className="eyebrow">{c.tag}</span><h3>{c.title}</h3><strong>{c.subtitle}</strong><p>{c.description}</p><span className="resource-link">View resource <ArrowRight size={16} /></span></a>)}</div><p className="source-note">No complete current Lyndons PDF catalogue has been verified. The November 2022 PDF is an expired offers flyer, not the full range. Always check current manufacturer technical and safety data.</p></section>
      <section id="branches" className="branch-section"><div className="container branch-layout"><div><span className="eyebrow light">GOOD PEOPLE. PRACTICAL ADVICE.</span><h2>Your local branch.<br />Part of your crew.</h2><p>Need a hand choosing a product or planning a delivery? Talk to your local Lyndons team.</p><label>Choose your branch<select value={branch} onChange={e => setBranch(e.target.value)}>{branches.map(b => <option key={b.name}>{b.name}</option>)}</select></label></div><div className="branch-card"><span className="eyebrow">YOUR LOCAL TEAM</span><h3><MapPin /> Lyndons {branch}</h3><a className="branch-phone" href={`tel:${currentBranch.phone.replaceAll(' ', '')}`}>{currentBranch.phone}</a><p>Call for stock, quotes and delivery enquiries.</p><a className="button primary full" href={currentBranch.url} target="_blank" rel="noreferrer">Address & opening hours <ExternalLink size={17} /></a><small>Check the branch page for current trading hours.</small></div></div></section>
    </>}</main>
    <footer><div className="container footer-main"><div><Brand /><p>Building & construction supplies.<br />Here to help you get on with the job.</p></div><div><strong>Get the job sorted</strong><a href="#products" onClick={() => go('products')}>Browse products</a><a href="#quote" onClick={() => go('quote')}>Your quote list</a><a href="#branches" onClick={() => go('branches')}>Find a branch</a></div><div><strong>Good to know</strong><a href="https://lyndons.com.au/customer-service/delivery" target="_blank" rel="noreferrer">Delivery information <ExternalLink size={12} /></a><a href="https://lyndons.com.au/privacy-policy" target="_blank" rel="noreferrer">Privacy policy <ExternalLink size={12} /></a><button className="text-button" onClick={lockPreview}><LockKeyhole size={13} /> Lock preview</button></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Lyndons · Website concept preview</span><span>Quote-only. No online payments.</span></div></footer>
    <div className="mobile-dock"><button onClick={() => go('products')}><Search size={20} /><span>Products</span></button><button onClick={() => go('branches')}><MapPin size={20} /><span>Branches</span></button><button onClick={() => go('quote')}><ClipboardList size={20} /><span>Your quote {total > 0 && <b>{total}</b>}</span></button></div><div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><CheckCircle2 size={20} /><span>{toast}</span><button onClick={() => go('quote')}>View quote <ArrowRight size={16} /></button></>}</div>{selected && <ProductDialog key={selected.id} product={selected} exactSelection={exactSelection} onClose={() => setSelected(null)} onAdd={add} />}
  </>;
}
export default App;