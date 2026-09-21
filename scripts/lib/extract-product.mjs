import { load } from 'cheerio';
import { createHash } from 'node:crypto';

export const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
export const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
export function extractProduct(html, source, checkedAt) {
  const $ = load(html);
  const name = clean($('.product__title').first().text());
  if (!name || !$('.product__content').length) throw new Error('Full product page missing; refusing cart fragment or challenge page');
  const brand = clean($('.product__brand').first().text()) || null;
  const descriptionNode = $('.product__description').clone();
  descriptionNode.find('br').replaceWith('\n');
  descriptionNode.find('p,li,tr,h2,h3').append('\n');
  const description = descriptionNode.text().split('\n').map(clean).filter(Boolean).join('\n');
  const breadcrumbs = [];
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      const schema = JSON.parse($(node).text());
      if (schema['@type'] === 'BreadcrumbList') for (const item of schema.itemListElement ?? []) breadcrumbs.push({ name: clean(item.item?.name), url: item.item?.['@id'] });
    } catch { /* Lyndons concatenates Product JSON objects for variants; use labelled DOM instead. */ }
  });
  const imageSources = [];
  $('.product-gallery__slide picture source[type="image/webp"]').each((_, node) => {
    const first = clean($(node).attr('srcset')).split(',')[0]?.trim().split(/\s+/)[0];
    if (first) imageSources.push(new URL(first, source).href);
  });
  if (!imageSources.length) $('.product__gallery-section img').each((_, node) => {
    const src = clean($(node).attr('src')).split(/\s+/)[0];
    if (src && !/placeholder|loader|icon/i.test(src)) imageSources.push(new URL(src, source).href);
  });
  const variants = [];
  $('#item_variant option').each((_, node) => {
    const variantId = $(node).attr('value');
    if (!variantId) return;
    const skuNode = $('.product__number').filter((_, el) => ($(el).attr('class') ?? '').split(/\s+/).includes(`show-hide-input-controls-item_variant-${variantId}`));
    variants.push({ sourceVariantId: variantId, label: clean($(node).text()), sku: clean(skuNode.first().text()) || null });
  });
  const sku = variants.length ? null : clean($('.product__number').first().text()) || null;
  const documents = [];
  $('.product__content a, .product__downloads a, .product__documents a').each((_, node) => {
    const href = $(node).attr('href');
    if (href && /\.pdf(?:\?|$)|\/asset\/download\//i.test(href)) documents.push({ name: clean($(node).text()), url: new URL(href, source).href });
  });
  const flags = [];
  if (!brand) flags.push('brand-not-listed');
  if (!description) flags.push('description-not-listed');
  if (!imageSources.length) flags.push('photo-not-listed');
  if (!sku && !variants.length) flags.push('sku-not-listed');
  if (/^\*+/.test(name)) flags.push('source-title-has-asterisks');
  if (/SDS MAX/i.test(name) && /SDS Plus/i.test(description)) flags.push('source-description-conflicts-with-title');
  if (/NRG/i.test(brand ?? '') && imageSources.some(u => /rockcote/i.test(u))) flags.push('source-image-brand-mismatch');
  return { id: `lyndons-${hash(source)}`, name, sku, brand, manufacturer: null, manufacturerStatus: 'not-independently-verified', description, descriptionSource: source, categories: breadcrumbs.filter(b => b.url !== source && !['Home', 'Products'].includes(b.name)), variants, images: [...new Set(imageSources)].map(url => ({ source: url, localPath: null, status: 'pending', rights: 'Existing Lyndons listing; approval required before wider commercial reuse' })), documents, source, checkedAt, flags };
}