import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProduct } from './lib/extract-product.mjs';
const source = 'https://lyndons.com.au/products/tools/example';
test('extracts variants and gallery only, not unrelated images or guessed manufacturer', () => {
  const html = `<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"item":{"name":"Home","@id":"https://lyndons.com.au/"}},{"item":{"name":"Tools","@id":"https://lyndons.com.au/products/tools"}}]}</script>
  <div class="product__gallery-section"><div class="product-gallery__slide"><picture><source type="image/webp" srcset="/media/a.webp 1x, /media/b.webp 2x"></picture></div></div>
  <div class="product__content"><span class="product__brand">Example Brand</span><h1 class="product__title">Drill</h1><span class="product__number">Select a variant below</span><span class="product__number show-hide-input-controls-item_variant-7">DRILL7</span><div class="product__description"><p>First line.</p><p>Second line.</p></div><select id="item_variant"><option value="">Choose</option><option value="7">7mm</option></select></div><img src="/unrelated.jpg">`;
  const p = extractProduct(html, source, '2026-09-21');
  assert.equal(p.manufacturer, null); assert.equal(p.brand, 'Example Brand');
  assert.deepEqual(p.variants, [{ sourceVariantId: '7', label: '7mm', sku: 'DRILL7' }]);
  assert.equal(p.images.length, 1); assert.equal(p.images[0].source, 'https://lyndons.com.au/media/a.webp');
  assert.equal(p.description, 'First line.\nSecond line.'); assert.equal(p.categories[0].name, 'Tools');
});
test('records missing fields instead of fabricating data', () => {
  const p = extractProduct('<div class="product__content"><h1 class="product__title">Plain block</h1></div>', source, '2026-09-21');
  assert.equal(p.brand, null); assert.equal(p.description, ''); assert.deepEqual(p.images, []);
  assert.deepEqual(p.flags, ['brand-not-listed','description-not-listed','photo-not-listed','sku-not-listed']);
});
test('rejects cart fragments and challenge pages', () => {
  assert.throws(() => extractProduct('<turbo-stream>cart</turbo-stream>', source, '2026-09-21'), /Full product page missing/);
});