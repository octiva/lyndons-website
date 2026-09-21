/** Reproducible research import. Does not invent manufacturers, prices or stock. */
import { mkdir, readFile, writeFile, stat, rename, rm, copyFile } from 'node:fs/promises';
import { renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { extractProduct, hash } from './lib/extract-product.mjs';
import { DEFAULT_CACHE_TTL_MS, recordRefreshReason, canPublishCatalogue } from './lib/catalogue-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'research/catalogue');
const recordsDir = path.join(output, 'records');
const imagesDir = path.join(output, 'images');
const checkedAt = new Date().toISOString();
const headers = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'User-Agent': 'LyndonsCatalogueResearch/1.0 (+https://github.com/octiva/lyndons-website)' };
const limit = Number(process.env.CATALOGUE_LIMIT || 0);
const concurrency = Math.max(1, Math.min(4, Number(process.env.CATALOGUE_CONCURRENCY || 3)));
// CATALOGUE_TTL_DAYS accepts non-negative days (including fractions); 0 refreshes all.
const ttlMs = process.env.CATALOGUE_TTL_DAYS === undefined ? DEFAULT_CACHE_TTL_MS : Number(process.env.CATALOGUE_TTL_DAYS) * 24 * 60 * 60 * 1000;
const forceRefresh = process.argv.slice(2).includes('--refresh');
await mkdir(recordsDir, { recursive: true }); await mkdir(imagesDir, { recursive: true });
const failures = [];
const staleRefreshFailures = [];
const stopController = new AbortController();
let stopped = false;
let stopReason = null;
let unique = [], queue = [], records = [];
let cursor = 0, done = 0;
let runError = null;
let published = false;

function stop(reason) {
  if (stopped) return;
  stopped = true;
  stopReason = reason;
  stopController.abort(new Error(reason));
}
function assertRunning() {
  if (stopped) throw new Error(stopReason);
}
const onInterrupt = () => stop('Interrupted by SIGINT');
const onTerminate = () => stop('Interrupted by SIGTERM');
process.on('SIGINT', onInterrupt);
process.on('SIGTERM', onTerminate);

// Preserve an existing cache file if a refreshed record cannot be written in full.
async function writeAtomic(file, contents) {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, contents);
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function fetchChecked(url) {
  // Every request, including images inside an already-running worker, passes here.
  assertRunning();
  const parsed = new URL(url);
  if (parsed.origin !== 'https://lyndons.com.au') throw new Error('Source host not allowed');
  const response = await fetch(url, { headers, signal: AbortSignal.any([stopController.signal, AbortSignal.timeout(30000)]) });
  if (response.status === 429 || response.status === 403) {
    stop(`Source requested stop: HTTP ${response.status}`);
    assertRunning();
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
function locations(xml) { return load(xml, { xmlMode: true })('loc').map((_, e) => e.children?.[0]?.data).get(); }

async function collectImages(record) {
  for (const image of record.images) {
    // Do not repeatedly attempt the remaining sources after any worker sees a stop.
    assertRunning();
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
    } catch (error) {
      assertRunning();
      image.status = 'failed'; image.error = error.message;
    }
  }
  assertRunning();
}

async function collect() {
  while (cursor < queue.length && !stopped) {
    const entry = queue[cursor++];
    const file = path.join(recordsDir, `${hash(entry.url)}.json`);
    let cachedRecord;
    let refreshReason = null;
    try {
      try { cachedRecord = JSON.parse(await readFile(file, 'utf8')); } catch (error) {
        if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
      }
      assertRunning();
      refreshReason = recordRefreshReason(cachedRecord, entry.lastModified, { now: Date.parse(checkedAt), ttlMs, force: forceRefresh });
      let record = cachedRecord;
      if (refreshReason) {
        const response = await fetchChecked(entry.url);
        record = extractProduct(await response.text(), entry.url, new Date().toISOString());
        record.sourceLastModified = entry.lastModified;
      }
      await collectImages(record);
      if (cachedRecord && refreshReason && record.images.some(image => image.status === 'failed')) throw new Error('Refreshed images incomplete; cached record retained');
      await writeAtomic(file, JSON.stringify(record, null, 2));
    } catch (error) {
      if (cachedRecord && refreshReason) staleRefreshFailures.push({ source: entry.url, reason: refreshReason, error: error.message });
      else failures.push({ source: entry.url, error: error.message });
    }
    done++; if (done % 100 === 0 || done === queue.length) console.log(`Processed ${done}/${queue.length}; failed pages: ${failures.length}; stale refresh failures: ${staleRefreshFailures.length}`);
  }
}

const csvCell = value => { const text = String(value ?? ''); return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; };

function makeReport() {
  const brands = Object.fromEntries([...new Set(records.map(p => p.brand ?? 'Unbranded / not listed'))].sort().map(b => [b, records.filter(p => (p.brand ?? 'Unbranded / not listed') === b).length]));
  const report = { checkedAt, discoveredPages: unique.length, attemptedPages: done, importedPages: records.length, variantRows: records.reduce((n,p) => n + (p.variants.length || 1),0), withDescriptions: records.filter(p => p.description).length, withPhotos: records.filter(p => p.images.length).length, downloadedPhotoReferences: records.flatMap(p => p.images).filter(i => i.status === 'downloaded').length, uniqueDownloadedPhotos: new Set(records.flatMap(p => p.images).filter(i => i.status === 'downloaded').map(i => i.localPath)).size, missingBrands: records.filter(p => !p.brand).length, failedPhotos: records.flatMap(p => p.images).filter(i => i.status === 'failed').length, manufacturerVerifiedProducts: 0, brands, failures, staleRefreshFailures, stopped, stopReason, limited: limit > 0, limit, ttlMs, forceRefresh, error: runError, scope: 'Public product sitemaps only, not the full stocked inventory. Brands are retailer attribution, not independently verified manufacturers.' };
  return { ...report, complete: canPublishCatalogue(report) };
}

async function publish(report) {
  const rows = [['page_id','sku','name','brand_as_listed','variant','categories','description_as_listed','source','photo_sources','downloaded_photos','flags']];
  for (const p of records) for (const variant of p.variants.length ? p.variants : [{sku:p.sku,label:''}]) rows.push([p.id, variant.sku, p.name,p.brand,variant.label,p.categories.map(c=>c.name).join(' > '),p.description,p.source,p.images.map(i=>i.source).join(' | '),p.images.map(i=>i.localPath??'').join(' | '),p.flags.join(' | ')]);
  const files = [
    ['products.json', JSON.stringify(records, null, 2)],
    ['products.csv', '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],
    ['report.json', JSON.stringify(report, null, 2)],
  ].map(([name, contents]) => ({ target: path.join(output, name), temporary: path.join(output, `${name}.${process.pid}.tmp`), backup: path.join(output, `${name}.${process.pid}.bak`), hadPrevious: false, contents }));
  const promoted = [];
  let rollbackFailed = false;
  try {
    // Stage all outputs before touching the last complete catalogue.
    for (const file of files) {
      await writeFile(file.temporary, file.contents);
      try { await copyFile(file.target, file.backup); file.hadPrevious = true; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    assertRunning();
    // No async gap for a stop handler between promotions; the success report is last.
    try {
      for (const file of files) { renameSync(file.temporary, file.target); promoted.push(file); }
    } catch (error) {
      for (const file of promoted.reverse()) {
        try {
          if (file.hadPrevious) renameSync(file.backup, file.target);
          else rmSync(file.target, { force: true });
        } catch (rollbackError) {
          rollbackFailed = true;
          console.error(`Could not restore ${file.target}: ${rollbackError.message}. Backup retained at ${file.backup}.`);
        }
      }
      if (rollbackFailed) throw new Error(`Publication and rollback failed; inspect retained backups: ${error.message}`);
      throw error;
    }
    published = true;
  } finally {
    for (const file of files) {
      await rm(file.temporary, { force: true });
      if (!rollbackFailed) await rm(file.backup, { force: true });
    }
  }
}

try {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('CATALOGUE_LIMIT must be a non-negative integer');
  if (!Number.isInteger(concurrency)) throw new Error('CATALOGUE_CONCURRENCY must be an integer');
  if (!Number.isFinite(ttlMs) || ttlMs < 0) throw new Error('CATALOGUE_TTL_DAYS must be finite and non-negative');
  const robots = await (await fetchChecked('https://lyndons.com.au/robots.txt')).text();
  await writeAtomic(path.join(output, 'robots.txt'), robots);
  if (/User-agent:\s*\*\s+Disallow:\s*\/\s*(?:\n|$)/i.test(robots)) throw new Error('robots.txt disallows crawling');
  const sitemapRoot = await (await fetchChecked('https://lyndons.com.au/sitemap.xml')).text();
  const sitemapUrls = locations(sitemapRoot).filter(u => /\/sitemap\/product\/\d+\.xml$/.test(u));
  if (!sitemapUrls.length) throw new Error('No product sitemaps found; refusing an empty catalogue');
  const entries = [];
  for (const url of sitemapUrls) {
    const $ = load(await (await fetchChecked(url)).text(), { xmlMode: true });
    if (!$('url').length) throw new Error(`Empty or invalid product sitemap: ${url}`);
    $('url').each((_, e) => {
      const source = $(e).find('loc').text().trim();
      if (new URL(source).origin !== 'https://lyndons.com.au') throw new Error(`Invalid product source in sitemap: ${url}`);
      entries.push({ url: source, lastModified: $(e).find('lastmod').text().trim(), sitemap: url });
    });
  }
  unique = [...new Map(entries.map(e => [e.url, e])).values()];
  queue = limit ? unique.slice(0, limit) : unique;
  await writeAtomic(path.join(output, 'discovery.json'), JSON.stringify({ checkedAt, sitemapUrls, totalProductPages: unique.length, products: unique }, null, 2));
  console.log(`Discovered ${unique.length} product pages from ${sitemapUrls.length} product sitemaps. Workers: ${concurrency}.`);
  await Promise.all(Array.from({ length: concurrency }, collect));
  for (const entry of queue) {
    try { records.push(JSON.parse(await readFile(path.join(recordsDir, `${hash(entry.url)}.json`), 'utf8'))); }
    catch (error) { failures.push({ source: entry.url, error: `Record unavailable: ${error.message}` }); }
  }
  const report = makeReport();
  if (report.complete) await publish(report);
} catch (error) {
  runError = error.message;
  console.error(runError);
} finally {
  try {
    const attempt = { ...makeReport(), published };
    await writeAtomic(path.join(output, 'attempt-report.json'), JSON.stringify(attempt, null, 2));
    console.log(JSON.stringify(attempt, null, 2));
    if (!published) console.error('Catalogue was not published successfully. See attempt-report.json for limit, stop or failure details.');
    if (!published || !attempt.complete) process.exitCode = 2;
  } finally {
    process.off('SIGINT', onInterrupt);
    process.off('SIGTERM', onTerminate);
  }
}