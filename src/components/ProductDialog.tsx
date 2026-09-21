import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Plus, X } from 'lucide-react';
import type { Product } from '../data/catalog';
import { ProductImage } from './ProductImage';
export function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (id: string, quantity?: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const [quantity, setQuantity] = useState(1);
  useEffect(() => { dialog.current?.showModal(); const node = dialog.current; return () => node?.close(); }, []);
  return <dialog ref={dialog} className="product-dialog" aria-labelledby="product-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="icon-button dialog-close" onClick={onClose} aria-label="Close product details"><X /></button>
    <div className="detail-grid">
      <div className="detail-image"><ProductImage product={product} /></div>
      <div>
        <span className="eyebrow">{product.brand}</span><h2 id="product-title">{product.name}</h2><p className="pack">{product.pack}</p>
        {product.imported && <div className="source-provenance"><strong>Imported listing — confirmation required.</strong> Description and brand are as listed by Lyndons. A supplier-library link is not an exact manufacturer/product match. Check current specifications before use.</div>}
        <p className="detail-description">{product.description}</p>
        <dl className="specs"><div><dt>Product reference</dt><dd>{product.sourceSku ?? product.id}</dd></div><div><dt>Manufacturer / brand</dt><dd>{product.manufacturer}</dd></div><div><dt>Availability & price</dt><dd>Confirmed by your branch</dd></div></dl>
        {product.note && <p className="notice">{product.note}</p>}
        <div className="detail-actions"><label>Quantity<input type="number" min="1" max="9999" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(9999, Math.floor(Number(e.target.value) || 1))))} /></label><button className="button primary" onClick={() => { onAdd(product.id, quantity); onClose(); }}><Plus size={18} /> Add to quote</button></div>
        <div className="source-links"><a href={product.source} target="_blank" rel="noreferrer">Original product listing <ExternalLink size={14} /></a>{product.supplier && <a href={product.supplier} target="_blank" rel="noreferrer">Supplier information <ExternalLink size={14} /></a>}{product.imageSource && <a href={product.imageSource} target="_blank" rel="noreferrer">Original product photo <ExternalLink size={14} /></a>}</div>
        <small>Source checked {product.verified}. Photos were downloaded from the existing Lyndons listing; packaging may vary. No stock or price is guaranteed.</small>
      </div>
    </div>
  </dialog>;
}