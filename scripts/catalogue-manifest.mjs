import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [
  { file: 'public/catalogues/lyndons-product-catalogue-november-2022.pdf', source: 'https://lyndons.com.au/asset/download/914/d718a2/lyndons-catalogue-nov-22-final.pdf', pages: 4, classification: 'Expired promotional offers flyer, November 2022; NOT a full-range catalogue or current price list' },
  { file: 'public/catalogues/lyndons-capability-statement.pdf', source: 'https://lyndons.com.au/asset/download/968/ef5a9a/lyndons-capability-statement-compressed.pdf', pages: 20, classification: 'Company capability statement; not product inventory; publication date unverified' },
  { file: 'public/catalogues/flextool-product-catalogue-v33.pdf', source: 'https://www.flextool.com.au/media/efmn05pp/flextool-product-catalogue-v33-spread.pdf', classification: 'Supplier catalogue version 33; not proof of Lyndons stock' },
];
for (const item of files) {
  const content = await readFile(path.join(root, item.file));
  if (content.subarray(0,5).toString() !== '%PDF-') throw new Error(`Not PDF: ${item.file}`);
  item.bytes = (await stat(path.join(root,item.file))).size;
  item.sha256 = createHash('sha256').update(content).digest('hex');
}
await writeFile(path.join(root, 'research/download-manifest.json'), JSON.stringify({ checkedAt: new Date().toISOString(), files, unavailable: [{ source:'https://rapidtool.com.au/wp-content/uploads/2026/07/RAPIDTOOL-Catalogue-6.pdf', status:403, action:'Not downloaded; access restriction respected. Official catalogue landing page remains accessible.' }] }, null, 2));
const products = JSON.parse(await readFile(path.join(root, 'src/data/generated/products.json'), 'utf8'));
const cell = value => { const s = String(value ?? ''); return `"${(/^[=+\-@\t\r]/.test(s) ? "'"+s : s).replaceAll('"','""')}"`; };
const rows = [['sku','product_name','brand_as_listed','manufacturer_status','category','variant_or_unit','description_as_listed','source_url','source_photo','supplier_resource','confirmation_notes','checked_at'], ...products.map(p => [p.id,p.name,p.brand,p.manufacturer,p.category,p.pack,p.description,p.source,p.imageSource,p.supplier,p.note,p.verified])];
await writeFile(path.join(root, 'public/data/lyndons-public-product-list.csv'), '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n'));
console.log(`Verified ${files.length} PDFs with checksums; exported ${products.length} spreadsheet rows.`);