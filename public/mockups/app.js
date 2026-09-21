/* Standalone visual prototype. No production basket, customer data or server submissions. */
import { searchProducts } from './search.js';
import { mountUpdates } from './updates.js';
const data = [
  { id: 'CMNT039', name: 'OneMix Concrete Mix', brand: 'Sunstate Cement', pack: '20kg bag', type: 'Concrete mixes', category: 'Concrete & cement', image: '36feef5dd38f3fd3.webp', description: 'A pre-blended mix of cement, sand and aggregate for general concreting and smaller jobs. Follow the bag instructions for mixing and placement.', source: 'https://lyndons.com.au/products/concreting-products-cement-accessories-cement-bagged-pre-blended/concrete-mix-20kg-bag', supplier: 'https://sunstatecement.com.au/our-products/' },
  { id: 'BLCMNT020', name: 'General Purpose Cement', brand: 'Bowser & Lever', pack: '20kg bag', type: 'Cement', category: 'Concrete & cement', image: '52f8a4a4ed9e18ea.webp', description: 'General-purpose cement for construction mixes. This is cement, not a ready-blended concrete mix. Confirm the mix design and application with your branch.', source: 'https://lyndons.com.au/products/concreting-products-cement-accessories-cement-bagged-pre-blended/gp-cement-20kg' },
  { id: 'CMNTSS55', name: 'Super Strength Concrete', brand: 'Easy Mix', pack: '20kg bag · 55MPa', type: 'Concrete mixes', category: 'Concrete & cement', image: 'ce231482a0734c5f.webp', description: 'Bagged concrete containing Portland cement, graded aggregates and admixtures. Follow the manufacturer’s mixing and curing instructions.', source: 'https://lyndons.com.au/products/concreting-products-cement-accessories-cement-bagged-pre-blended/55mpa-super-strength-concrete-20kg-bag', supplier: 'https://www.easymixsales.com.au/' },
  { id: 'SIKA212', name: 'SikaGrout®-212 HP', brand: 'Sika', pack: '20kg bag', type: 'Grouts', category: 'Concrete & cement', image: 'bcb387fc384bf2f7.webp', description: 'Non-shrink cementitious grout with two-stage expansion to compensate for shrinkage. Confirm the current technical data and suitability before use.', source: 'https://lyndons.com.au/products/concreting-products-cement-accessories-grouts/sikagrout-212hp-20kg-bag-flowable-411020', supplier: 'https://aus.sika.com/' },
  { id: 'ANTI280', name: 'Sealer Grip Anti-Slip Coarse', brand: 'CCS', pack: '280g bag', type: 'Sealer additives', category: 'Concrete & cement', image: '14abf566c069b722.webp', description: 'Textured-grip additive for compatible CCS concrete sealers. Refer to current manufacturer instructions for compatibility and application.', source: 'https://lyndons.com.au/products/concrete-cement-products-equipment-coatings-sealants/anti-slip-coarse-280g-bag', supplier: 'https://concretecoloursystems.com.au/data-sheets-guidelines' },
  { id: 'SGE626', name: 'Floor Squeegee with Handle', brand: 'MasterFinish', pack: '600mm · with handle', type: 'Hand tools', category: 'Tools & equipment', image: '92a560d5139afc34.webp', description: 'Neoprene-blade squeegee supplied with a 1.5m handle. The listing says 600mm while its description specifies 626mm; confirm blade size with your branch.', source: 'https://lyndons.com.au/products/safety-ppe-hand-tools/floor-squeegee-600mm-w-handle', supplier: 'https://www.agpulie.com.au/DOWNLOADS' },
  { id: 'SUPCOA605B', name: 'PM605B Pool Basecoat Render', brand: 'Supa Coat', pack: '20kg bag', type: 'Bagged render', category: 'Render & finishes', image: '2152434336099b99.webp', description: 'Polymer-modified cement render designed as a pool basecoat. Refer to the manufacturer’s technical sheet for substrates, preparation and finishing requirements.', source: 'https://lyndons.com.au/products/rendering-products-equipment-bagged-render/render-pool-basecoat-pm605b-20kg', supplier: 'https://supacoat.com.au/wp-content/uploads/2023/07/TDS-PM605B-Pool-Basecoat-Render.pdf' },
  { id: 'LEVE005', name: 'RL-H5A Laser Level Kit', brand: 'Topcon', pack: 'With LS100D receiver', type: 'Lasers & measuring', category: 'Machinery', image: 'f3a0c596482f53d7.webp', description: 'Rotating laser package listed with the LS100D receiver. Confirm kit contents, current specifications and suitability with the branch.', source: 'https://lyndons.com.au/products/machinery-equipment-lasers-receivers/laser-level-rl-h5a-dry-battery-prem-ls100d-receiver', supplier: 'https://www.topconpositioning.com/' },
];
const categoryImages = [
  ['Concrete & cement', 'CMNT039', 'Bagged products, grout & additives'],
  ['Tools & equipment', 'SGE626', 'Hand tools & finishing equipment'],
  ['Render & finishes', 'SUPCOA605B', 'Renders & texture systems'],
  ['Machinery', 'LEVE005', 'Site equipment & measuring'],
];
let concept = new URLSearchParams(location.search).get('concept') === 'desk' ? 'desk' : 'counter';
let branch = 'Windsor';
let basket = new Map();
let noticeTimer;
let listMode = false;
let unlocked = false;
let disposeUpdates = () => {};
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const image = p => `../images/products/${p.image}`;
const route = (page, params = {}) => `#/${page}${Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`;
const link = (page, text, cls = '', params = {}) => `<a class="${cls}" href="${route(page, params)}">${text}</a>`;
function current() { const [path, query] = location.hash.replace(/^#\/?/, '').split('?'); return { path: path || 'home', params: new URLSearchParams(query || '') }; }
function notify(message) { $('#notice').textContent = message; $('#notice').classList.add('visible'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('#notice').classList.remove('visible'), 4500); }
function add(id, amount = 1) {
  const p = data.find(item => item.id === id);
  if (!p || !Number.isInteger(amount) || amount < 1 || amount > 9999) return;
  if ((basket.get(id) || 0) + amount > 9999) { notify('Maximum 9,999 per line in this mockup.'); return; }
  basket.set(id, (basket.get(id) || 0) + amount); updateCount(); notify(`${amount} × ${p.name} added to the demo quote.`);
}
function updateCount() { $('#quote-count').textContent = [...basket.values()].reduce((sum, n) => sum + n, 0); }
function breadcrumbs(items) { return `<nav class="breadcrumbs" aria-label="Breadcrumb">${link('home', 'Home')}${items.map(([name, href]) => `<span aria-hidden="true">/</span>${href ? `<a href="${href}">${escape(name)}</a>` : `<span aria-current="page">${escape(name)}</span>`}`).join('')}</nav>`; }
function home() {
  if (concept === 'desk') return `<div class="wrap desk-home"><div class="page-heading"><div><p class="section-label">LYNDONS TRADE SUPPLIES</p><h1>What’s on your list?</h1><p>Find a product, enter a code, or start a quote.</p></div>${link('products', 'Browse products →', 'primary')}</div><div class="desk-start"><section><h2>Quick add to quote</h2><p>Know the code? Start here.</p>${quickForm()}<small>Try CMNT039 or SIKA212. Sample catalogue only.</small></section><aside><span class="section-label">YOUR BRANCH</span><h2>Lyndons ${branch}</h2><p>For product advice, pricing and delivery enquiries.</p><a href="tel:${branch === 'Windsor' ? '0738577788' : '0740534000'}">${branch === 'Windsor' ? '07 3857 7788' : '07 4053 4000'}</a>${link('branches', 'Branch details →')}</aside></div><div class="desk-index"><section><h2>Product directory</h2>${categoryImages.map(([name,,desc], i) => link('products', `<span class="index-number">0${i + 1}</span><span><strong>${name}</strong><small>${desc}</small></span><span aria-hidden="true">→</span>`, 'directory-row', {category:name})).join('')}</section><section><h2>Sample product list</h2>${data.slice(0,4).map(p => `<div class="mini-row"><img src="${image(p)}" alt="" width="55" height="55"><span>${link(`product/${p.id}`, escape(p.name))}<small>${p.id} · ${p.pack}</small></span><button data-add="${p.id}" aria-label="Add ${escape(p.name)}">Add +</button></div>`).join('')}<p class="subtle">Example only—not a personalised list or sales ranking.</p></section></div></div>`;
  return `<div class="wrap home search-first">
    <section class="landing-intro" aria-labelledby="landing-title"><h1 id="landing-title">Find your building supplies.</h1><p>Use the search above to find products, brands or codes.</p><small>Interactive sample: 8 real products. The complete range remains in the existing preview.</small></section>
    <section class="updates" aria-label="Updates and useful information" aria-roledescription="carousel">
      <div class="updates-top"><strong>Updates & useful information</strong><span>Example editorial panels · not company news</span></div>
      <div class="updates-panels">
        <article data-slide role="group" aria-roledescription="slide" aria-label="1 of 3"><div><span class="section-label">PRODUCT RESOURCES</span><h2>Check the details.<br>Choose the right product.</h2><p>Supplier catalogues and technical information, together in one place.</p>${link('catalogues','Browse catalogues & data sheets →','primary')}</div><img src="../images/products/bcb387fc384bf2f7.webp" alt="SikaGrout product example" width="435" height="435"></article>
        <article data-slide role="group" aria-roledescription="slide" aria-label="2 of 3" hidden><div><span class="section-label">YOUR LOCAL BRANCH</span><h2>Talk through your next job.</h2><p>Confirm products, collection and delivery options with your Lyndons team.</p>${link('branches','Find a branch →','primary')}</div><img class="site-photo" src="../images/construction.webp" alt="Construction work from the existing Lyndons website" width="712" height="452"></article>
        <article data-slide role="group" aria-roledescription="slide" aria-label="3 of 3" hidden><div><span class="section-label">EQUIPMENT CATALOGUE</span><h2>Explore the Flextool range.</h2><p>The downloaded Volume 33 supplier catalogue is available in our document library. Branch availability needs confirmation.</p>${link('catalogues','View catalogue library →','primary')}</div><div class="catalogue-panel-art" aria-hidden="true"><span>SUPPLIER CATALOGUE</span><strong>Flextool</strong><span>VOLUME 33</span><small>70 pages · PDF</small></div></article>
      </div>
      <div class="updates-controls"><button data-toggle-updates type="button">Pause updates</button><div class="slide-dots">${[0,1,2].map(i=>`<button type="button" data-show-slide="${i}" aria-label="Show update ${i+1}" aria-pressed="${i===0}"><span aria-hidden="true"></span></button>`).join('')}</div><span data-slide-count>1 / 3</span><button type="button" data-slide-direction="-1" aria-label="Previous update">←</button><button type="button" data-slide-direction="1" aria-label="Next update">→</button></div><p class="sr-only" data-slide-status role="status" aria-live="polite"></p>
    </section>
    <section id="home-products" class="home-product-range" aria-labelledby="home-products-heading"><div class="section-heading"><div><h2 id="home-products-heading">Browse products</h2><p id="home-results-count" role="status">8 sample products</p></div>${link('products','Browse products →','text-link')}</div><div class="range-categories" aria-label="Product categories">${categoryImages.map(([name])=>link('products',escape(name),'',{category:name})).join('')}</div><div id="home-match-note"></div><div class="product-grid" id="home-product-grid">${data.map(card).join('')}</div><p class="listing-note">All eight products in this mockup are shown. This is a layout preview, not the complete stocked range. ${link('catalogues','Catalogues & data sheets →')}</p></section>
  </div>`;
}
function quickForm() { return `<form class="quick-form"><label>Product code<input name="code" placeholder="e.g. CMNT039" required autocomplete="off"></label><label class="small-qty">Qty<input name="quantity" type="number" min="1" max="9999" value="1" required></label><button type="submit" class="primary">Add to quote</button><p class="quick-error error" role="alert"></p></form>`; }
function card(p) { return `<article class="product-card"><a class="product-picture" href="${route(`product/${p.id}`)}"><img src="${image(p)}" alt="${escape(p.name)}" width="250" height="190" loading="lazy"></a><div class="product-copy"><span class="product-brand">${escape(p.brand)}</span><h2>${link(`product/${p.id}`, escape(p.name))}</h2><p>${escape(p.pack)}</p><small>${p.id}</small><div class="card-action"><span>Price on request</span><button data-add="${p.id}" aria-label="Add ${escape(p.name)} to quote">Add to quote <span aria-hidden="true">+</span></button></div></div></article>`; }
function products(params) {
  const category = params.get('category') || 'All products';
  const query = params.get('q') || '';
  const brand = params.get('brand') || '';
  const type = params.get('type') || '';
  const sort = params.get('sort') || '';
  const result = searchProducts(data.filter(p => (category === 'All products' || p.category === category) && (!brand || p.brand === brand) && (!type || p.type === type)), query);
  let found = result.items;
  if (sort === 'az') found = [...found].sort((a,b) => a.name.localeCompare(b.name));
  const rows = concept === 'desk' || listMode;
  return `<div class="wrap listing">${breadcrumbs([['Products', category !== 'All products' ? route('products') : null], ...(category !== 'All products' ? [[category,null]] : [])])}<div class="page-heading"><div><h1>${escape(query ? `Results for “${query}”` : category)}</h1><p>${found.length} sample products · select a product for details</p></div><span class="preview-chip">SAMPLE RANGE</span></div><div class="listing-layout"><aside class="filter-sidebar"><h2>Product categories</h2>${link('products', 'All products', category === 'All products' ? 'category-link active' : 'category-link')}${categoryImages.map(([name]) => link('products', `${name}<span>${data.filter(p=>p.category===name).length}</span>`, category===name?'category-link active':'category-link',{category:name})).join('')}<h2>Refine your results</h2><form id="filters"><label>Brand<select name="brand"><option value="">All brands</option>${[...new Set(data.filter(p=>category === 'All products'||p.category===category).map(p=>p.brand))].sort().map(b=>`<option${b===brand?' selected':''}>${escape(b)}</option>`).join('')}</select></label><label>Product type<select name="type"><option value="">All types</option>${[...new Set(data.filter(p=>category==='All products'||p.category===category).map(p=>p.type))].map(t=>`<option${t===type?' selected':''}>${escape(t)}</option>`).join('')}</select></label><button class="outline" type="submit">Apply filters</button>${link('products', 'Clear filters', 'clear', category !== 'All products'?{category}:{})}</form><div class="filter-help"><strong>Not sure which product?</strong><p>Your local team can help.</p>${link('branches', 'Contact your branch →')}</div></aside><section class="results" aria-label="Product results"><div class="results-toolbar"><button id="mobile-filters" class="outline" aria-expanded="false">Filters & categories</button><span>${found.length} results</span><label>Sort by<select id="sort"><option value="">Featured samples</option><option value="az"${sort==='az'?' selected':''}>Name A–Z</option></select></label>${concept !== 'desk' ? `<button id="view-toggle" class="view-toggle" aria-label="${rows?'Show grid view':'Show list view'}">${rows?'Grid view':'List view'}</button>`:''}</div>${(brand||type||query)?`<div class="applied">${[brand,type,query].filter(Boolean).map(x=>`<span>${escape(x)}</span>`).join('')}</div>`:''}${found.length ? rows ? `<div class="supply-table"><div class="table-heading"><span>Product / code</span><span>Size / pack</span><span>Quote</span></div>${found.map(p=>`<article class="supply-row"><div><a href="${route(`product/${p.id}`)}"><img src="${image(p)}" alt="" width="75" height="75"></a><span><small>${escape(p.brand)}</small><h2>${link(`product/${p.id}`,escape(p.name))}</h2><code>${p.id}</code></span></div><p>${escape(p.pack)}</p><button data-add="${p.id}" class="outline" aria-label="Add ${escape(p.name)} to quote">Add +</button></article>`).join('')}</div>` : `<div class="product-grid">${found.map(card).join('')}</div>` : `<div class="empty"><h2>No sample products match.</h2><p>This mockup contains eight real product examples, not the full catalogue.</p>${link('products','Clear search & filters','primary')}</div>`}<p class="listing-note">Design preview: 8 examples from the existing catalogue. The full 3,853-option range remains in the ${'<a href="../" target="_blank" rel="noreferrer">existing preview ↗</a>'}.</p></section></div></div>`;
}
function product(id) {
  const p = data.find(item=>item.id===id);
  if (!p) return `<div class="wrap empty"><h1>Product not in this mockup</h1>${link('products','Browse sample products','primary')}</div>`;
  return `<div class="wrap detail">${breadcrumbs([['Products',route('products')],[p.category,route('products',{category:p.category})],[p.name,null]])}<div class="product-detail"><div class="detail-gallery"><div class="large-image"><img src="${image(p)}" alt="${escape(p.name)}" width="435" height="435"></div><small>Source listing photo. Packaging may vary.</small></div><section class="product-order"><span class="product-brand">${escape(p.brand)}</span><h1>${escape(p.name)}</h1><div class="product-ident"><span>${escape(p.pack)}</span><span>Product code <strong>${p.id}</strong></span></div><p class="intro-description">${escape(p.description)}</p><div class="order-box"><div><strong>Request a quote</strong><span>Price & availability confirmed by your branch</span></div><form id="product-add" data-id="${p.id}"><label>Quantity<input name="quantity" type="number" min="1" max="9999" value="1" required inputmode="numeric"></label><button class="primary" type="submit">Add to quote <span aria-hidden="true">+</span></button></form><small>No payment required. Adding a product does not send a request.</small></div><div class="fulfilment"><div><span aria-hidden="true">↳</span><p><strong>Collect from ${branch}</strong><small>Confirm availability with the branch</small></p>${link('branches','Change')}</div><div><span aria-hidden="true">↗</span><p><strong>Delivery to site</strong><small>Ask your branch about delivery options</small></p>${link('help','Details')}</div></div></section></div><div class="product-information"><section><h2>Product information</h2><dl><div><dt>Brand as listed</dt><dd>${escape(p.brand)}</dd></div><div><dt>Listed size / pack</dt><dd>${escape(p.pack)}</dd></div><div><dt>Lyndons reference</dt><dd>${p.id}</dd></div><div><dt>Product type</dt><dd>${escape(p.type)}</dd></div></dl><p class="subtle">Confirm the current specification, ordering unit and suitability before ordering. No stock status is implied.</p></section><section><h2>Documents & supplier information</h2><a class="document-link" href="${p.source}" target="_blank" rel="noreferrer"><span>Original Lyndons listing<small>Product source</small></span><span aria-hidden="true">↗</span></a>${p.supplier?`<a class="document-link" href="${p.supplier}" target="_blank" rel="noreferrer"><span>${p.id==='SUPCOA605B'?'PM605B technical data sheet':'Supplier information'}<small>${p.id==='SUPCOA605B'?'Manufacturer PDF · confirm current revision':'Brand-level resource · not an exact product match'}</small></span><span aria-hidden="true">↗</span></a>`:''}<p class="subtle">Only verified links are shown. A missing document is not a claim that one does not exist.</p></section></div></div>`;
}
function catalogues() { const docs = [
  ['Product list', 'Lyndons online product list', '3,853 collected product / variant rows', 'CSV', '../data/lyndons-public-product-list.csv'],
  ['Supplier catalogue', 'Flextool product catalogue', 'Volume 33 · 70 pages', 'PDF', '../catalogues/flextool-product-catalogue-v33.pdf'],
  ['Company information', 'Lyndons capability statement', '20 pages · not product inventory', 'PDF', '../catalogues/lyndons-capability-statement.pdf'],
  ['Archived offers', 'Lyndons November 2022 offers', 'Expired four-page flyer · NOT the full catalogue', 'PDF', '../catalogues/lyndons-product-catalogue-november-2022.pdf'],
]; return `<div class="wrap standard">${breadcrumbs([['Catalogues & data sheets',null]])}<div class="page-heading"><div><h1>Catalogues & data sheets</h1><p>Product references, supplier catalogues and company information.</p></div></div><div class="document-table">${docs.map(([type,title,desc,format,url])=>`<article><span class="file-type">${format}</span><div><small>${type}</small><h2>${title}</h2><p>${desc}</p></div><a href="${url}" target="_blank" rel="noreferrer" aria-label="View ${title}">View ↗</a><a href="${url}" download aria-label="Download ${title}">Download ↓</a></article>`).join('')}</div><p class="notice-box">No complete, current Lyndons PDF catalogue has been verified. The November 2022 document is an expired offers flyer.</p></div>`; }
function brands() { return `<div class="wrap standard">${breadcrumbs([['Brands',null]])}<div class="page-heading"><div><h1>Brands</h1><p>Explore the brands in this sample range.</p></div></div><div class="brand-directory">${[...new Set(data.map(p=>p.brand))].sort().map(b=>link('products',`${escape(b)} <span>View products →</span>`,'',{brand:b})).join('')}</div><p class="subtle">Brand attribution follows existing Lyndons listings. No claim of an exclusive supplier relationship.</p></div>`; }
function branches() { return `<div class="wrap standard">${breadcrumbs([['Branches',null]])}<div class="page-heading"><div><h1>Your local Lyndons</h1><p>Two sample branch screens. ${'<a href="https://lyndons.com.au/locations" target="_blank" rel="noreferrer">View all 12 sales branches ↗</a>'}</p></div></div><div class="branch-grid">${[['Windsor','07 3857 7788','windsor','lyndons-windsor','37 Victoria Street, Windsor QLD 4030'],['Cairns','07 4053 4000','cairns','lyndons-cairns','See branch page for address and hours']].map(([name,phone,email,slug,address])=>`<article><span class="section-label">QUEENSLAND</span><h2>Lyndons ${name}</h2><p>${address}</p><a class="phone" href="tel:${phone.replaceAll(' ','')}">${phone}</a><a href="mailto:${email}@lyndons.com.au">${email}@lyndons.com.au</a><div><button type="button" data-branch="${name}" class="${branch===name?'outline':'primary'}">${branch===name?'Selected branch':'Choose this branch'}</button><a href="https://lyndons.com.au/locations/${slug}" target="_blank" rel="noreferrer">Address & hours ↗</a></div></article>`).join('')}</div></div>`; }
function help() { return `<div class="wrap standard help-page">${breadcrumbs([['Delivery & help',null]])}<h1>Delivery & help</h1><p class="lead">Get the right products to the right place.</p><details open><summary>How does a quote work?</summary><p>Add products and quantities to your list. The existing preview can prepare a request for your branch; this design mockup only demonstrates a basket. Nothing is sent automatically.</p></details><details><summary>Can I collect from a branch?</summary><p>Choose your preferred branch and ask the team to confirm availability and collection timing.</p></details><details><summary>Can you deliver to a job site?</summary><p>Discuss the site address, access restrictions, required date and unloading arrangements with your branch. Delivery charges and timing need confirmation.</p></details><details><summary>What if a product is not listed?</summary><p>The public catalogue is not the full stocked inventory. Contact your branch with the product name, size and quantity.</p></details>${link('branches','Contact a branch →','primary')}</div>`; }
function quote() { return `<div class="wrap standard quote-page">${breadcrumbs([['Your quote',null]])}<div class="page-heading"><div><h1>Your quote</h1><p>Check your list before contacting the branch.</p></div>${link('products','← Continue browsing','text-link')}</div>${basket.size?`<div class="quote-layout"><section aria-label="Quote products">${[...basket].map(([id,quantity])=>{const p=data.find(x=>x.id===id);return `<article class="quote-row"><img src="${image(p)}" alt="" width="90" height="90"><div><h2>${link(`product/${id}`,escape(p.name))}</h2><p>${p.pack}</p><small>${id}</small></div><label>Qty<input class="basket-quantity" data-id="${id}" aria-label="Quantity for ${escape(p.name)}" type="number" min="1" max="9999" value="${quantity}" required></label><button data-remove="${id}" aria-label="Remove ${escape(p.name)}">Remove</button></article>`;}).join('')}</section><aside class="quote-review"><span class="section-label">QUOTE SUMMARY</span><h2>Lyndons ${branch}</h2><p>${basket.size} product ${basket.size===1?'line':'lines'}</p><hr><strong>Price confirmed by your branch</strong><p>No online payment. This mockup does not submit quote requests or collect contact details.</p><button class="primary" id="demo-review">Review demo list →</button><p id="demo-review-message" role="status"></p><a href="../#quote" target="_blank" rel="noreferrer">Open the existing quote flow ↗</a><small>The mockup basket does not transfer to the existing preview.</small></aside></div>`:`<div class="empty"><h2>Your list is empty</h2><p>Add a sample product to see the quote-page design.</p>${link('products','Browse products →','primary')}</div>`}</div>`; }
function render() {
  if (!unlocked) return;
  disposeUpdates();
  const {path,params} = current();
  const section = path.split('/')[0];
  $('#site').className = concept;
  $('#search').value = params.get('q') || '';
  const views = { home, products:()=>products(params), catalogues, brands, branches, help, quote };
  $('#content').innerHTML = section==='product' ? product(path.slice(8)) : views[section] ? views[section]() : `<div class="wrap empty"><h1>Page not found</h1>${link('home','Return home','primary')}</div>`;
  $('#filters select[name="brand"]')?.setAttribute('aria-label', 'Brand');
  $('#filters select[name="type"]')?.setAttribute('aria-label', 'Product type');
  if (section === 'home' && concept === 'counter') {
    disposeUpdates = mountUpdates($('.updates'));
    updateHomeResults(params.get('q') || '');
  }
  if (section === 'products' && searchProducts(data, params.get('q') || '').approximate) {
    $('.results').insertAdjacentHTML('afterbegin', '<p class="notice-box">Close matches shown. Check the product name and code before adding.</p>');
  }
  document.title = `Lyndons — ${$('#content h1')?.textContent || 'Design preview'} | ${concept==='desk'?'Supply Desk':'Trade Counter'} mockup`;
  document.querySelectorAll('[data-nav]').forEach(a=>{ if (a.dataset.nav === (section==='product'?'products':section)) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  document.querySelectorAll('[data-concept]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.concept===concept)));
  $('#branch-name').textContent = branch;
  $('.nav-call').textContent = branch==='Windsor'?'07 3857 7788':'07 4053 4000';
  $('.nav-call').href = branch==='Windsor'?'tel:0738577788':'tel:0740534000';
  $('#navigation').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded','false');
  window.scrollTo(0,0); $('#content').focus({preventScroll:true});
}
$('#unlock-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode($('#password').value));
  const hash = [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if (hash !== '53d224100379cc35a7b9ed0ad55776f4d218d5a9a06ae4a077e4a029da45bb33') { $('#gate-error').textContent='That password isn’t right. Please try again.'; return; }
  $('#password').value=''; unlocked=true; $('#gate').hidden=true; $('#prototype').hidden=false; render();
});
$('#lock').addEventListener('click',()=>{disposeUpdates();unlocked=false;basket=new Map();updateCount();$('#prototype').hidden=true;$('#gate').hidden=false;$('#password').focus();});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();location.hash=route('products',{q:$('#search').value.trim()});render();});
$('#menu-toggle').addEventListener('click',()=>{const open=$('#navigation').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{
  const target = e.target.closest('button'); if (!target) return;
  if (target.dataset.concept) { concept=target.dataset.concept;const url=new URL(location.href);url.searchParams.set('concept',concept);history.replaceState(null,'',url);render(); }
  if (target.dataset.add) add(target.dataset.add);
  if (target.dataset.remove) { basket.delete(target.dataset.remove);updateCount();render(); }
  if (target.dataset.branch) { branch=target.dataset.branch;render();notify(`Demo branch changed to ${branch}.`); }
  if (target.id==='view-toggle') {listMode=!listMode;render();}
  if (target.id==='mobile-filters') {const shown=$('.filter-sidebar').classList.toggle('expanded');target.setAttribute('aria-expanded',String(shown));}
  if (target.id==='demo-review') {
    const invalid = [...document.querySelectorAll('.basket-quantity')].find(input=>!input.checkValidity());
    if (invalid) {invalid.reportValidity();return;}
    $('#demo-review-message').textContent='Demo list reviewed. Nothing has been sent. The contact and submission flow is outside this visual mockup.';
  }
});
document.addEventListener('submit',e=>{
  const form=e.target;
  if(form.id==='product-add') {e.preventDefault();add(form.dataset.id,Number(new FormData(form).get('quantity')));}
  if(form.id==='filters') {e.preventDefault();const {params}=current();const fields=new FormData(form);for(const key of ['brand','type']){if(fields.get(key))params.set(key,fields.get(key));else params.delete(key);}location.hash=`#/products?${params}`;render();}
  if(form.classList.contains('quick-form')) {e.preventDefault();const fields=new FormData(form);const id=String(fields.get('code')).trim().toUpperCase();const p=data.find(p=>p.id===id);form.querySelector('.quick-error').textContent=p?'':'Code not in this sample. Try CMNT039 or browse the sample range.';if(p)add(id,Number(fields.get('quantity')));}
});
document.addEventListener('change',e=>{
  if(e.target.id==='sort'){const{params}=current();params.set('sort',e.target.value);location.hash=`#/products?${params}`;render();}
  if(e.target.classList.contains('basket-quantity')){if(e.target.checkValidity()){basket.set(e.target.dataset.id,Number(e.target.value));updateCount();}else e.target.reportValidity();}
});
window.addEventListener('hashchange',render);

function updateHomeResults(query) {
  if (!$('#home-product-grid')) return;
  const result = searchProducts(data, query);
  $('#home-results-count').textContent = `${result.items.length} sample ${result.items.length===1?'product':'products'}${query.trim() ? ` matching “${query.trim()}”` : ''}`;
  $('#home-match-note').innerHTML = result.approximate ? '<p class="notice-box">Close matches shown—check the product name and code before adding.</p>' : '';
  $('#home-product-grid').innerHTML = result.items.length ? result.items.map(card).join('') : '<div class="empty"><h3>No matching sample products</h3><p>Try “concrete”, “grout” or a product code. Only eight examples are included.</p><button type="button" data-reset-search>Show all sample products</button></div>';
}
document.addEventListener('input',event=>{
  if (event.target.id !== 'search') return;
  if (current().path === 'home' && concept === 'counter') {
    const value = event.target.value;
    updateHomeResults(value);
  }
});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-reset-search]')) {$('#search').value='';updateHomeResults('');$('#search').focus();}
});