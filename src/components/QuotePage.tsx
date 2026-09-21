import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Download, ExternalLink, FileText, Mail, MapPin, Minus, Plus, Trash2, Truck } from 'lucide-react';
import { branches, products } from '../data/catalog';
import { quoteText } from '../lib/quote';
import type { CartLine, QuoteDetails } from '../lib/quote';
import { ProductImage } from './ProductImage';

export function QuotePage({ cart, setCart, details, setDetails, onBrowse }: { cart: CartLine[]; setCart: (cart: CartLine[]) => void; details: QuoteDetails; setDetails: (details: QuoteDetails) => void; onBrowse: () => void }) {
  const [step, setStep] = useState(1);
  const [copyStatus, setCopyStatus] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const text = quoteText(cart, details);
  const selectedBranch = branches.find(b => b.name === details.branch)!;
  function update(key: keyof QuoteDetails, value: string) { setDetails({ ...details, [key]: value }); }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'lyndons-quote-request.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy() { try { await navigator.clipboard.writeText(text); setCopyStatus('Copied to clipboard.'); } catch { setCopyStatus('Copy is unavailable. Please download the request instead.'); } }
  function quantity(id: string, value: number) { if (Number.isFinite(value)) setCart(cart.map(line => line.id === id ? { ...line, quantity: Math.max(1, Math.min(9999, Math.floor(value))) } : line)); }
  if (!cart.length) return <section className="container empty-quote"><ClipboardList size={52} /><h1>Your quote list is empty</h1><p>Find what you need and tap “Add to quote”. No prices to guess, no payment required.</p><button className="button primary" onClick={onBrowse}>Browse products <ArrowRight size={18} /></button></section>;
  return <section className="container quote-page"><button className="text-button" onClick={onBrowse}><ArrowLeft size={17} /> Continue browsing</button><div className="section-heading"><div><span className="eyebrow">LET’S GET YOUR JOB SORTED</span><h1 ref={heading} tabIndex={-1}>{step === 1 ? 'Your quote list' : step === 2 ? 'A few job details' : 'Review & send your request'}</h1></div><span className="muted">No payment. No commitment.</span></div><ol className="steps">{['Check your list', 'Your details', 'Review & send'].map((label, i) => <li key={label} className={step >= i + 1 ? 'active' : ''} aria-current={step === i + 1 ? 'step' : undefined}><span>{step > i + 1 ? <Check size={16} /> : i + 1}</span>{label}</li>)}</ol>
    <div className="quote-layout"><div>
      {step === 1 && <div className="quote-lines">{cart.map(line => { const p = products.find(p => p.id === line.id)!; return <article className="quote-line" key={p.id}><div className="cart-image"><ProductImage product={p} /></div><div className="cart-product"><span className="eyebrow">{p.brand}</span><h3>{p.name}</h3><p>{p.pack}</p><small>Ref: {p.id}</small></div><div className="cart-controls"><div className="quantity"><button onClick={() => quantity(p.id, line.quantity - 1)} aria-label={`Decrease ${p.name}`} disabled={line.quantity <= 1}><Minus size={16} /></button><input aria-label={`Quantity for ${p.name}`} type="number" min="1" max="9999" value={line.quantity} onChange={e => quantity(p.id, Number(e.target.value))} /><button onClick={() => quantity(p.id, line.quantity + 1)} aria-label={`Increase ${p.name}`} disabled={line.quantity >= 9999}><Plus size={16} /></button></div><button className="text-button remove" onClick={() => setCart(cart.filter(l => l.id !== p.id))}><Trash2 size={15} /> Remove<span className="sr-only"> {p.name}</span></button></div></article>; })}<p className="notice"><FileText size={20} /> Need something else? Add unlisted products or special requirements in the next step.</p></div>}
      {step === 2 && <form id="quote-details" className="details-form" onSubmit={e => { e.preventDefault(); setStep(3); }}><h2>How can we reach you?</h2><p>Required fields are marked *. Details stay in this tab until you choose to share them.</p><div className="form-grid"><label>Your name *<input autoComplete="name" required maxLength={100} value={details.name} onChange={e => update('name', e.target.value)} /></label><label>Business name<input autoComplete="organization" maxLength={120} value={details.company} onChange={e => update('company', e.target.value)} /></label><label>Email *<input autoComplete="email" type="email" required maxLength={150} value={details.email} onChange={e => update('email', e.target.value)} /></label><label>Phone *<input autoComplete="tel" type="tel" required pattern={String.raw`[+0-9 \(\)\-]{6,25}`} title="Enter a phone number using digits, spaces, +, brackets or hyphens." value={details.phone} onChange={e => update('phone', e.target.value)} /></label><label>Trade account (optional)<input maxLength={60} value={details.account} onChange={e => update('account', e.target.value)} /></label><label>Preferred branch *<select value={details.branch} onChange={e => update('branch', e.target.value)}>{branches.map(b => <option key={b.name}>{b.name}</option>)}</select></label></div><h2>Getting it to your job</h2><fieldset className="fulfilment"><legend>Collection or delivery</legend><label><input type="radio" name="fulfilment" checked={details.fulfilment === 'pickup'} onChange={() => update('fulfilment', 'pickup')} /><MapPin size={20} /> Collect from branch</label><label><input type="radio" name="fulfilment" checked={details.fulfilment === 'delivery'} onChange={() => update('fulfilment', 'delivery')} /><Truck size={20} /> Deliver to site</label></fieldset>{details.fulfilment === 'delivery' && <label>Delivery address *<textarea autoComplete="street-address" required maxLength={400} value={details.address} onChange={e => update('address', e.target.value)} /></label>}<label>Preferred date (optional)<input type="date" min={new Date().toLocaleDateString('en-CA')} value={details.date} onChange={e => update('date', e.target.value)} /></label><label>Other products or job notes<textarea maxLength={2000} rows={4} placeholder="Can’t find a product? Add the name, size and quantity here. Include any site access requirements." value={details.notes} onChange={e => update('notes', e.target.value)} /></label><p className="small">The branch will confirm stock, price, timing and any delivery charges. <a href="https://lyndons.com.au/privacy-policy" target="_blank" rel="noreferrer">Lyndons privacy policy <ExternalLink size={12} /></a></p></form>}
      {step === 3 && <div className="review-panel">
        <span className="review-icon"><CheckCircle2 size={30} /></span>
        <h2>Ready for your local team.</h2>
        <p className="notice"><strong>Not sent yet.</strong> This preview prepares your request; it does not submit it automatically.</p>
        <p>Download or copy your full list, then share it with <strong>Lyndons {details.branch}</strong>. No order is placed until the branch confirms it with you.</p>
        <div className="review-summary">
          <h3>{cart.length} product {cart.length === 1 ? 'line' : 'lines'}</h3>
          {cart.map(line => <p key={line.id}><span>{products.find(p => p.id === line.id)!.name}</span><strong>× {line.quantity}</strong></p>)}
          <hr />
          <p><span>{details.name} · {details.company || 'Personal enquiry'}</span></p>
          <p><span>{details.email}<br />{details.phone}</span></p>
          <p><span>{details.fulfilment === 'pickup' ? `Collect from ${details.branch}` : `Deliver to: ${details.address}`}</span></p>
          {details.account && <p><span>Trade account: {details.account}</span></p>}
          {details.date && <p><span>Requested date: {details.date} (to be confirmed)</span></p>}
          {details.notes && <p className="notes-review">{details.notes}</p>}
        </div>
        <div className="review-buttons">
          <button className="button primary" onClick={download}><Download size={18} /> Download request</button>
          <button className="button outline" onClick={copy}><ClipboardList size={18} />Copy request</button>
        </div>
        <p role="status" className="small">{copyStatus}</p>
        <a className="button outline full" href={`mailto:${selectedBranch.email}?subject=${encodeURIComponent('Quote request — ' + (details.company || details.name))}&body=${encodeURIComponent(encodeURIComponent(text).length < 1500 ? text : `Hello Lyndons ${details.branch},\n\nPlease quote the items in my attached request.\n\nIMPORTANT: Attach the downloaded lyndons-quote-request.txt file before sending.\n\n${details.name}\n${details.phone}`)}`}>
          <Mail size={18} /> Open email to {details.branch}
        </a>
        <p className="small">Your email app opens a draft. Check it and press Send yourself. For long requests, attach the downloaded file. Email: <a href={`mailto:${selectedBranch.email}`}>{selectedBranch.email}</a></p>
        <a className="text-button" href={selectedBranch.url} target="_blank" rel="noreferrer">{details.branch} contact details <ExternalLink size={15} /></a>
      </div>}
    </div><aside className="quote-summary"><ClipboardList size={26} /><h2>Your job, sorted.</h2><div className="summary-row"><span>Product lines</span><strong>{cart.length}</strong></div><div className="summary-row"><span>Total units</span><strong>{cart.reduce((sum, line) => sum + line.quantity, 0)}</strong></div><hr /><p><Check size={16} /> Branch-confirmed pricing</p><p><Check size={16} /> Collection or site delivery</p><p><Check size={16} /> No online payment</p>{step === 1 && <button className="button primary full" onClick={() => setStep(2)}>Add your details <ArrowRight size={17} /></button>}{step === 2 && <button type="submit" form="quote-details" className="button primary full">Review request <ArrowRight size={17} /></button>}{step > 1 && <button className="text-button" onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> {step === 2 ? 'Back to your list' : 'Edit your details'}</button>}<small>A quote request isn’t an order. Your branch will confirm the details.</small></aside></div>
  </section>;
}