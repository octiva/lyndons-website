import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = async name => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const records = await read('research/catalogue/products.json');
const report = await read('research/catalogue/report.json');
const suppliers = await read('research/supplier-sources.json');
const audit = [];
for (const entry of suppliers) {
  try {
    const r = await fetch(entry.url, { signal: AbortSignal.timeout(20000) });
    audit.push({ ...entry, status: r.status, resolvedUrl: r.url, checkedAt: new Date().toISOString() });
    await r.body?.cancel();
  } catch (error) { audit.push({ ...entry, status: null, error: error.message }); }
}
await writeFile(path.join(root, 'research/supplier-audit.json'), JSON.stringify(audit, null, 2));
const verified = audit.filter(e => e.status === 200);
const supplierByBrand = new Map(verified.flatMap(entry => entry.brands.map(brand => [brand.toLowerCase(), entry])));
const categories = {
  'Concreting Products, Cement & Accessories': 'Concrete & cement',
  'Tools & Accessories': 'Tools & equipment',
  'Machinery & Equipment': 'Machinery',
  'Render, Coatings, Textures & Equipment': 'Render & finishes',
  'Masonry Blocks & Bricks': 'Masonry',
  'Bonding & Sealants': 'Bonding & sealants',
  'Chemicals': 'Sealants & chemicals',
  'Safety & PPE': 'Safety & PPE',
  'Building Materials': 'Building materials',
  'Formwork & Accessories': 'Formwork',
  'Retaining Wall Systems': 'Retaining walls',
  'Waterproofing': 'Waterproofing',
  'Reinforcing Steel, Mesh, Bar & Accessories': 'Reinforcing steel',
  'General Hardware': 'General hardware',
  'Cleaning Products & Equipment': 'Cleaning',
  'Grease, Lubricants & Degreasers': 'Lubricants',
  'Joint Systems': 'Joint systems',
  'Bulk Sand & Aggregate': 'Sand & aggregate',
};
const flagNotes = {
  'brand-not-listed': 'No brand is identified on the source listing.',
  'description-not-listed': 'The source has no detailed description. Ask the branch for specifications.',
  'photo-not-listed': 'The source does not provide a product photo.',
  'sku-not-listed': 'Source ordering code needs confirmation.',
  'source-title-has-asterisks': 'The original name carries asterisks; current listing status needs branch confirmation.',
  'source-description-conflicts-with-title': 'The source title and description disagree on SDS MAX / SDS Plus. Confirm the shank before ordering.',
  'source-image-brand-mismatch': 'The source photo filename names a different brand. Confirm manufacturer and packaging.',
};
const imageDir = path.join(root, 'public/images/products');
await mkdir(imageDir, { recursive: true }); await mkdir(path.join(root, 'src/data/generated'), { recursive: true });
const copied = new Set(); const products = [];
for (const p of records) {
  for (const image of p.images.filter(i => i.status === 'downloaded')) {
    if (!copied.has(image.localPath)) { await copyFile(path.join(root, image.localPath), path.join(imageDir, path.basename(image.localPath))); copied.add(image.localPath); }
  }
  const image = p.images.find(i => i.status === 'downloaded');
  const supplier = supplierByBrand.get(p.brand?.toLowerCase());
  const variants = p.variants.length ? p.variants : [{ sku: p.sku, label: '' }];
  for (const variant of variants) {
    const id = variant.sku || `${p.id}-${variant.sourceVariantId || 'base'}`;
    const name = p.name.replace(/^\*+/, '').trim() + (variant.label ? ` — ${variant.label}` : '');
    products.push({
      id, name, brand: p.brand || 'Brand not listed', manufacturer: p.brand ? `${p.brand} (brand listed by Lyndons; exact manufacturer not independently verified)` : 'Not identified by the source',
      category: categories[p.categories[0]?.name] || 'Other supplies',
      pack: variant.label || 'Pack / unit: confirm with branch',
      description: p.description || `${name}. Detailed specifications are not provided in the source listing. Please confirm the required specification with your branch.`,
      image: image ? `images/products/${path.basename(image.localPath)}` : '',
      imageSource: image?.source || '', source: p.source, supplier: supplier?.url,
      note: p.flags.map(f => flagNotes[f]).filter(Boolean).join(' '),
      verified: p.checkedAt.slice(0, 10), imported: true, sourceVariantId: variant.sourceVariantId || null,
    });
  }
}
if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Duplicate ordering references: resolve before publishing');
await writeFile(path.join(root, 'src/data/generated/products.json'), JSON.stringify(products));
const summary = { ...report, brands: undefined, failures: undefined, supplierResources: verified.length, productsWithSupplierResource: records.filter(p => supplierByBrand.has(p.brand?.toLowerCase())).length, supplierCoverageNote: 'Brand-level resource matches only; not individual product/manufacturer verification.', downloadedPdfs: [{ name:'Lyndons November 2022 offers flyer', pages:4, file:'catalogues/lyndons-product-catalogue-november-2022.pdf', warning:'Expired promotional prices; not a full-range catalogue.' }, { name:'Lyndons capability statement',pages:20,file:'catalogues/lyndons-capability-statement.pdf',warning:'Company overview, not product inventory.' }] };
await mkdir(path.join(root, 'public/data'), { recursive: true });
await writeFile(path.join(root, 'public/data/catalogue-coverage.json'), JSON.stringify(summary, null, 2));
await writeFile(path.join(root, 'public/data/supplier-resources.json'), JSON.stringify(verified, null, 2));
console.log(JSON.stringify({ publishedRows: products.length, copiedPhotos: copied.size, supplierResources: verified.length, productsWithSupplierResource: summary.productsWithSupplierResource, missingDescriptions: records.length-report.withDescriptions, missingPhotos: records.length-report.withPhotos }, null, 2));
if (audit.some(e => e.status !== 200)) console.log('Unavailable supplier resources excluded; see research/supplier-audit.json.');