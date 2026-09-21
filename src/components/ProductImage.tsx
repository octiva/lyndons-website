import { useState } from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../data/catalog';
export function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(!product.image);
  return failed ? <span className="image-fallback"><Package size={40} /><span>Photo unavailable</span></span> : <img src={product.image} alt={product.name} loading="lazy" width="435" height="435" onError={() => setFailed(true)} />;
}