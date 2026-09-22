import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, LockKeyhole, MapPin, Menu, Phone, Search, X } from 'lucide-react';
import { branches, products } from './data/catalog';
import { emptyDetails, hasRetiredCartItems, loadCart } from './lib/quote';
import type { CartLine, QuoteDetails } from './lib/quote';
import { listingHref, useStorefrontRoute } from './lib/storefront-route';
import { Brand } from './components/PreviewGate';
import { QuotePage } from './components/QuotePage';
import { BranchesPage, BrandsPage, CataloguePage, CataloguesPage, CategoriesPage, HelpPage, NotFound, ProductPage } from './components/StorefrontPages';
import './App.css';
import './styles/storefront.css';

const navigationLinks = [
  ['products', 'Products'], ['categories', 'Categories'], ['brands', 'Brands'],
  ['catalogues', 'Catalogues & data sheets'], ['branches', 'Branches'], ['help', 'Delivery & help'],
] as const;

function App({ onLock }: { onLock: () => void }) {
  const { route, navigate, revision, focus, scroll } = useStorefrontRoute();
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [storageError, setStorageError] = useState(false);
  const [retiredCartItems] = useState(hasRetiredCartItems);
  const [details, setDetails] = useState<QuoteDetails>(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('lyndons-branch'); } catch { /* Memory-only preference. */ }
    return { ...emptyDetails, branch: branches.some(branch => branch.name === saved) ? saved! : 'Windsor' };
  });
  const [toast, setToast] = useState('');
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const [searchDraft, setSearchDraft] = useState({ revision, value: route.filters.q });
  const main = useRef<HTMLElement>(null);
  const lastCatalogue = useRef('#/products');
  const branch = details.branch;
  const currentBranch = branches.find(item => item.name === branch)!;
  const total = cart.reduce((sum, line) => sum + line.quantity, 0);
  const menu = menuAt === revision;
  const query = searchDraft.revision === revision ? searchDraft.value : route.filters.q;
  const dirtyDetails = [details.name, details.email, details.phone, details.company, details.address, details.date, details.notes, details.account].some(value => value.trim());

  useEffect(() => {
    if (!dirtyDetails) return;
    // Safari can emit beforeunload for a download that leaves this tab open.
    // Allow one download-related event; genuine document navigation still warns.
    let downloadUntil = 0;
    const download = (event: globalThis.MouseEvent) => {
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
  useEffect(() => {
    try { localStorage.setItem('lyndons-quote-v1', JSON.stringify(cart)); } catch {
      // oxlint-disable-next-line react/set-state-in-effect
      setStorageError(true);
    }
  }, [cart]);
  useEffect(() => { try { localStorage.setItem('lyndons-branch', branch); } catch { /* Branch remains in memory. */ } }, [branch]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4200); return () => clearTimeout(timer); }, [toast]);

  useLayoutEffect(() => {
    if (route.page === 'home' || route.page === 'products') lastCatalogue.current = listingHref('products', route.filters);
    const heading = main.current?.querySelector<HTMLElement>('h1');
    document.title = `Lyndons — ${heading?.textContent || 'Products'} | Building & construction supplies`;
    if (focus === 'none') return;
    const target = focus === 'results' ? main.current?.querySelector<HTMLElement>('#catalogue-results') : heading ?? main.current;
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    if (focus === 'restore') window.scrollTo({ top: scroll, behavior: 'instant' });
    else if (focus === 'results' && target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 20, behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [revision, route, focus, scroll]);

  function setBranch(value: string) {
    if (branches.some(item => item.name === value)) setDetails(previous => ({ ...previous, branch: value }));
  }
  function add(id: string, quantity = 1) {
    const product = products.find(item => item.id === id);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 9999) return;
    const existing = cart.find(line => line.id === id);
    if ((existing?.quantity ?? 0) + quantity > 9999) { setToast('Maximum 9,999 units per product line. Adjust the quantity in your quote.'); return; }
    setCart(previous => {
      const present = previous.find(line => line.id === id);
      return present ? previous.map(line => line.id === id ? { ...line, quantity: Math.min(9999, line.quantity + quantity) } : line) : [...previous, { id, quantity }];
    });
    setToast(`${quantity} × ${product.name} added to your quote`);
  }
  function typeSearch(value: string) {
    setSearchDraft({ revision, value });
    if (route.page === 'home' || route.page === 'products') navigate(listingHref(route.page, { ...route.filters, q: value, page: 1 }), { replace: true, focus: 'none' });
  }
  function search(event: FormEvent) {
    event.preventDefault();
    navigate(listingHref('products', { q: query.trim() }));
  }
  function lockPreview() {
    if (dirtyDetails && !window.confirm('Lock this preview and discard your contact/job details? Your product list will stay saved.')) return;
    onLock();
  }
  function internalLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    const href = anchor?.getAttribute('href');
    if (!anchor || anchor.target || anchor.hasAttribute('download') || !href?.startsWith('#/')) return;
    event.preventDefault();
    navigate(href, { focus: anchor.dataset.routeFocus === 'results' ? 'results' : 'page' });
  }
  function pageContent() {
    switch (route.page) {
      case 'home': case 'products': return <CataloguePage key={route.page} route={route} navigate={navigate} onAdd={add} branch={branch} />;
      case 'product': return <ProductPage route={route} navigate={navigate} onAdd={add} branch={branch} />;
      case 'categories': return <CategoriesPage />;
      case 'catalogues': return <CataloguesPage />;
      case 'brands': return <BrandsPage />;
      case 'branches': return <BranchesPage branch={branch} setBranch={setBranch} />;
      case 'help': return <HelpPage />;
      case 'quote': return <QuotePage cart={cart} setCart={setCart} details={details} setDetails={setDetails} onBrowse={() => navigate(lastCatalogue.current)} />;
      default: return <NotFound />;
    }
  }
  const activePage = route.page === 'product' ? 'products' : route.page;

  return <div className="trade-site" onClick={internalLink}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); main.current?.focus(); main.current?.scrollIntoView({ behavior: 'instant' }); }}>Skip to content</a>
    <div className="trade-service-bar"><div className="trade-wrap"><span>Building & construction supplies</span><a href="#/branches">{branches.length} Queensland branches <MapPin size={13} /></a></div></div>
    <header className="trade-header">
      <div className="trade-wrap trade-masthead">
        <a href="#/home" aria-label="Lyndons home"><Brand /></a>
        <form className="trade-search header-search" role="search" aria-label="Product search" onSubmit={search}>
          <label className="sr-only" htmlFor="storefront-search">Search products or product codes</label>
          <input id="storefront-search" type="search" placeholder="Search products, brands or product codes" autoComplete="off" maxLength={200} value={query} onChange={event => typeSearch(event.target.value)} />
          <button type="submit" aria-label="Search products"><Search size={22} /></button>
        </form>
        <div className="trade-branch-control"><MapPin size={21} /><label>Your local branch<select aria-label="Your local branch" value={branch} onChange={event => setBranch(event.target.value)}>{branches.map(item => <option key={item.name}>{item.name}</option>)}</select></label></div>
        <a className="trade-quote-link" href="#/quote" aria-label={`Your quote, ${total} items`} aria-current={route.page === 'quote' ? 'page' : undefined}><ClipboardList size={22} /><span>Your quote</span><b>{total}</b></a>
        <button className="trade-menu-toggle" type="button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls="trade-navigation" onClick={() => setMenuAt(menu ? null : revision)}>{menu ? <X size={20} /> : <Menu size={20} />}<span>Menu</span></button>
      </div>
      <nav id="trade-navigation" className={`trade-navigation ${menu ? 'is-open' : ''}`} aria-label="Main navigation"><div className="trade-wrap">{navigationLinks.map(([page, label]) => <a key={page} href={`#/${page}`} aria-current={activePage === page ? 'page' : undefined}>{label}</a>)}<a className="trade-nav-phone" href={`tel:${currentBranch.phone.replaceAll(' ', '')}`}><Phone size={14} />{currentBranch.phone}</a></div></nav>
    </header>
    {storageError && <p role="status" className="trade-notice trade-wrap">Your browser can’t save this quote list. Keep this tab open and download your request before leaving.</p>}
    {retiredCartItems && <p role="status" className="trade-notice trade-wrap">Some older preview items need to be selected again and were removed from your saved list. For PolyGlow, choose the required colour before adding it. No size or colour was selected automatically.</p>}
    <main id="main" ref={main} tabIndex={-1} className={route.page === 'quote' ? 'trade-quote-content' : 'trade-content'} data-page={route.page}>{pageContent()}</main>
    <footer className="trade-footer"><div className="trade-wrap trade-footer-main"><div><Brand /><span>Building & construction supplies</span></div><nav aria-label="Footer navigation"><a href="#/products">Browse products</a><a href="#/catalogues">Catalogues & data sheets</a><a href="#/branches">Contact a branch</a><a href="#/help">Help with a quote</a></nav></div><div className="trade-wrap trade-footer-fine"><span>© {new Date().getFullYear()} Lyndons · Website preview · Quote-only. No online payments.</span><a href="https://lyndons.com.au/privacy-policy" target="_blank" rel="noreferrer">Privacy policy</a><button type="button" onClick={lockPreview}><LockKeyhole size={14} />Lock preview</button></div><p className="trade-wrap trade-footer-disclaimer">Prices and availability are confirmed by your branch. The client-side preview gate is not secure authentication.</p></footer>
    <div className={`trade-toast ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">{toast && <><CheckCircle2 size={19} /><span>{toast}</span><a href="#/quote">View quote <ArrowRight size={15} /></a><button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={17} /></button></>}</div>
  </div>;
}

export default App;