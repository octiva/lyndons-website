import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Plus, X } from 'lucide-react';
import { productFamilies } from '../data/catalog';
import type { Product } from '../data/catalog';
import { ProductImage } from './ProductImage';
import { QuantityInput } from './QuantityInput';
export function ProductDialog({ product: initialProduct, exactSelection = false, onClose, onAdd }: { product: Product; exactSelection?: boolean; onClose: () => void; onAdd: (id: string, quantity?: number) => void }) {
  const variants = productFamilies.get(initialProduct.familyId) ?? [initialProduct];
  const [variantId, setVariantId] = useState(variants.length === 1 || exactSelection ? initialProduct.id : '');
  const product = variants.find(p => p.id === variantId) ?? initialProduct;
  const [validQuantity, setValidQuantity] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null); const [quantity, setQuantity] = useState(1);
  useEffect(() => { dialog.current?.showModal(); const node = dialog.current; return () => node?.close(); }, []);
  return <dialog ref={dialog} className="product-dialog" aria-labelledby="product-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="icon-button dialog-close" onClick={onClose} aria-label="Close product details"><X /></button>
    <div className="detail-grid">
      <div><div className="detail-image"><ProductImage key={product.image} product={product} /></div>{variants.length > 1 && <small>Source listing photo may show several options; confirm the selected size or colour above.</small>}</div>
      <div>
        <span className="eyebrow">{product.brand}</span><h2 id="product-title">{variantId ? product.name : product.familyName}</h2><p className="pack">{variantId ? product.pack : 'Choose the size or colour for your job.'}</p>
        {variants.length > 1 && <label className="variant-picker" htmlFor="product-variant">Choose size / colour<select id="product-variant" value={variantId} onChange={e => setVariantId(e.target.value)} required><option value="">Select an option</option>{variants.map(p => <option key={p.id} value={p.id}>{p.variantLabel || p.pack} — {p.sourceSku ?? p.id}</option>)}</select></label>}
        <div className="detail-actions"><div><label htmlFor="product-quantity">Quantity</label><QuantityInput id="product-quantity" label="Quantity" value={quantity} onChange={setQuantity} onValidityChange={setValidQuantity} /></div><button className="button primary" disabled={!variantId || !validQuantity} onClick={() => { if (variantId && validQuantity) { onAdd(product.id, quantity); onClose(); } }}><Plus size={18} /> Add to quote</button></div>
        {product.note && <p className="notice">{product.note}</p>}
        {product.imported && <div className="source-provenance"><strong>Imported listing — confirmation required.</strong> Description and brand are as listed by Lyndons. A supplier-library link is not an exact manufacturer/product match. Check current specifications before use.</div>}
        <p className="detail-description">{product.description}</p>
        <dl className="specs"><div><dt>Product reference</dt><dd>{variantId ? product.sourceSku ?? product.id : 'Select an option above'}</dd></div><div><dt>Product type</dt><dd>{product.subcategory || product.category}</dd></div><div><dt>Manufacturer / brand</dt><dd>{product.manufacturer}</dd></div><div><dt>Availability & price</dt><dd>Confirmed by your branch</dd></div></dl>
        <div className="source-links"><a href={product.source} target="_blank" rel="noreferrer">Original product listing <ExternalLink size={14} /></a>{product.supplier && <a href={product.supplier} target="_blank" rel="noreferrer">Supplier information <ExternalLink size={14} /></a>}{product.imageSource && <a href={product.imageSource} target="_blank" rel="noreferrer">Original product photo <ExternalLink size={14} /></a>}</div>
        <small>Source checked {product.verified}. Photos were downloaded from the existing Lyndons listing; packaging may vary. No stock or price is guaranteed.</small>
      </div>
    </div>
  </dialog>;
}