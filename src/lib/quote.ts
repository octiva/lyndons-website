import { products } from '../data/catalog';

export interface CartLine { id: string; quantity: number }
export interface QuoteDetails { name: string; email: string; phone: string; company: string; branch: string; fulfilment: 'pickup' | 'delivery'; address: string; date: string; notes: string; account: string }
export const emptyDetails: QuoteDetails = { name: '', email: '', phone: '', company: '', branch: 'Windsor', fulfilment: 'pickup', address: '', date: '', notes: '', account: '' };
export function safeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, number>();
  for (const line of value) {
    if (line && products.some(p => p.id === line.id) && Number.isInteger(line.quantity) && line.quantity > 0) result.set(line.id, Math.min(9999, (result.get(line.id) ?? 0) + line.quantity));
  }
  return [...result].map(([id, quantity]) => ({ id, quantity }));
}
export function loadCart(): CartLine[] {
  try { return safeCart(JSON.parse(localStorage.getItem('lyndons-quote-v1') ?? '[]')); } catch { return []; }
}
export function hasRetiredCartItems(): boolean {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('lyndons-quote-v1') ?? '[]');
    return Array.isArray(saved) && saved.some(line => line && typeof line.id === 'string' && !products.some(p => p.id === line.id));
  } catch { return false; }
}
export function quoteText(cart: CartLine[], d: QuoteDetails): string {
  return ['LYNDONS — QUOTE REQUEST (NOT AN ORDER)', '', ...cart.map(line => {
    const p = products.find(product => product.id === line.id)!;
    return `${line.quantity} × ${p.name} | ${p.pack} | Ref: ${p.sourceSku ?? p.id}\n${p.source}`;
  }), '', `Name: ${d.name}`, `Company: ${d.company || '—'}`, `Email: ${d.email}`, `Phone: ${d.phone}`, `Trade account: ${d.account || '—'}`, `Preferred branch: ${d.branch}`, `Collection / delivery: ${d.fulfilment}`, ...(d.fulfilment === 'delivery' ? [`Delivery address: ${d.address}`] : []), `Requested date (not guaranteed): ${d.date || 'To be discussed'}`, `Other products / job notes: ${d.notes || '—'}`, '', 'Please confirm pricing, availability, delivery costs and product suitability. No payment is included.'].join('\n');
}
// Integration seam: resolve only on an authenticated server, never from a client-side account number.
export interface PricingProvider {
  getPrices(input: { productIds: string[]; customerId: string; branchId: string }): Promise<{ productId: string; unitPriceExGst: number; currency: 'AUD'; validUntil: string }[]>;
}