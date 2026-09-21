/** Reproducible research import. Does not invent manufacturers, prices or stock. */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { extractProduct, hash } from './lib/extract-product.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'research/catalogue');
const recordsDir = path.join(output, 'records');
const imagesDir = path.join(output, 'images');
const checkedAt = new Date().toISOString();
const headers = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'User-Agent': 'LyndonsCatalogueResearch/1.0 (+https://github.com/octiva/lyndons-website)' };
const limit = Number(process.env.CATALOGUE_LIMIT || 0);
const concurrency = Math.max(1, Math.min(4, Number(process.env.CATALOGUE_CONCURRENCY || 3)));
await mkdir(recordsDir, { recursive: true }); await mkdir(imagesDir, { recursive: true });
const failures = [];
let stopped = false;
async function fetchChecked(url) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://lyndons.com.au') throw new Error('Source host not allowed');
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (response.status === 429 || response.status === 403) { stopped = true; throw new Error(`Source requested stop: HTTP ${response.status}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
const robots = await (await fetchChecked('https://lyndons.com.au/robots.txt')).text();
await writeFile(path.join(output, 'robots.txt'), robots);
if (/User-agent:\s*\*\s+Disallow:\s*\/\s*(?:\n|$)/i.test(robots)) throw new Error('robots.txt disallows crawling');
function locations(xml) { return load(xml, { xmlMode: true })('loc').map((_, e) => e.children?.[0]?.data).get(); }
const sitemapRoot = await (await fetchChecked('https://lyndons.com.au/sitemap.xml')).text();
const sitemapUrls = locations(sitemapRoot).filter(u => /\/sitemap\/product\/\d+\.xml$/.test(u));
const entries = [];
for (const url of sitemapUrls) {
  const $ = load(await (await fetchChecked(url)).text(), { xmlMode: true });
  $('url').each((_, e) => entries.push({ url: $(e).find('loc').text(), lastModified: $(e).find('lastmod').text(), sitemap: url }));
}
const unique = [...new Map(entries.map(e => [e.url, e])).values()];
await writeFile(path.join(output, 'discovery.json'), JSON.stringify({ checkedAt, sitemapUrls, totalProductPages: unique.length, products: unique }, null, 2));
console.log(`Discovered ${unique.length} product pages from ${sitemapUrls.length} product sitemaps. Workers: ${concurrency}.`);
const queue = limit ? unique.slice(0, limit) : unique;
let cursor = 0, done = 0;
async function collect() {
  while (cursor < queue.length && !stopped) {
    const entry = queue[cursor++];
    const file = path.join(recordsDir, `${hash(entry.url)}.json`);
    try {
      let record;
      try { record = JSON.parse(await readFile(file, 'utf8')); } catch {
        const response = await fetchChecked(entry.url);
        record = extractProduct(await response.text(), entry.url, checkedAt);
        record.sourceLastModified = entry.lastModified;
      }
      for (const image of record.images) {
        const extension = path.extname(new URL(image.source).pathname).toLowerCase();
        if (!['.webp', '.jpg', '.jpeg', '.png'].includes(extension)) { image.status = 'unsupported-format'; continue; }
        const localPath = `research/catalogue/images/${hash(image.source)}${extension}`;
        try {
          const target = path.join(root, localPath);
          try { const info = await stat(target); if (!info.size) throw new Error('Empty image'); } catch {
            const response = await fetchChecked(image.source);
            if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Image response is not an image');
            const bytes = new Uint8Array(await response.arrayBuffer());
            if (!bytes.length || bytes.length > 15_000_000) throw new Error('Unexpected image size');
            await writeFile(target, bytes);
          }
          image.localPath = localPath; image.status = 'downloaded'; delete image.error;
        } catch (error) { image.status = 'failed'; image.error = error.message; }
      }
      await writeFile(file, JSON.stringify(record, null, 2));
    } catch (error) { failures.push({ source: entry.url, error: error.message }); }
    done++; if (done % 100 === 0 || done === queue.length) console.log(`Processed ${done}/${queue.length}; failed pages: ${failures.length}`);
  }
}
await Promise.all(Array.from({ length: concurrency }, collect));
const records = [];
for (const entry of queue) { try { records.push(JSON.parse(await readFile(path.join(recordsDir, `${hash(entry.url)}.json`), 'utf8'))); } catch { /* Explicit failure report below. */ } }
const brands = Object.fromEntries([...new Set(records.map(p => p.brand ?? 'Unbranded / not listed'))].sort().map(b => [b, records.filter(p => (p.brand ?? 'Unbranded / not listed') === b).length]));
const report = { checkedAt, discoveredPages: unique.length, attemptedPages: done, importedPages: records.length, variantRows: records.reduce((n,p) => n + (p.variants.length || 1),0), withDescriptions: records.filter(p => p.description).length, withPhotos: records.filter(p => p.images.length).length, downloadedPhotoReferences: records.flatMap(p => p.images).filter(i => i.status === 'downloaded').length, uniqueDownloadedPhotos: new Set(records.flatMap(p => p.images).filter(i => i.status === 'downloaded').map(i => i.localPath)).size, missingBrands: records.filter(p => !p.brand).length, failedPhotos: records.flatMap(p => p.images).filter(i => i.status === 'failed').length, manufacturerVerifiedProducts: 0, brands, failures, stopped, scope: 'Public product sitemaps only, not the full stocked inventory. Brands are retailer attribution, not independently verified manufacturers.' };
await writeFile(path.join(output, 'products.json'), JSON.stringify(records, null, 2));
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
const csvCell = value => { const text = String(value ?? ''); return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; };
const rows = [['page_id','sku','name','brand_as_listed','variant','categories','description_as_listed','source','photo_sources','downloaded_photos','flags']];
for (const p of records) for (const variant of p.variants.length ? p.variants : [{sku:p.sku,label:''}]) rows.push([p.id, variant.sku, p.name,p.brand,variant.label,p.categories.map(c=>c.name).join(' > '),p.description,p.source,p.images.map(i=>i.source).join(' | '),p.images.map(i=>i.localPath??'').join(' | '),p.flags.join(' | ')]);
await writeFile(path.join(output, 'products.csv'), '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'));
console.log(JSON.stringify(report, null, 2));
if (failures.length || stopped || report.failedPhotos) process.exitCode = 2;