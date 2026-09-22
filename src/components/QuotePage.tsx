import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Download,
  ExternalLink, FileText, Mail, MapPin, Trash2, Truck,
} from 'lucide-react';
import { branches, products } from '../data/catalog';
import { QUOTE_REQUEST_FILENAME, quoteEmail, quoteText } from '../lib/quote';
import type { CartLine, QuoteDetails } from '../lib/quote';
import { contactValidationFields, localDateString, normalizeContactDetails, validateContactDetails } from '../lib/contact-validation';
import type { ContactValidationErrors, ContactValidationField } from '../lib/contact-validation';
import { ProductImage } from './ProductImage';
import { QuantityInput } from './QuantityInput';

interface QuotePageProps {
  cart: CartLine[];
  setCart: (cart: CartLine[]) => void;
  details: QuoteDetails;
  setDetails: (details: QuoteDetails) => void;
  onBrowse: () => void;
}

// Key by the complete quote text so edits discard readiness without reset effects.
function EmailHandoff({ text, details, email }: { text: string; details: QuoteDetails; email: string }) {
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const { href, requiresAttachment } = quoteEmail(text, details, email);
  const ready = !requiresAttachment || (downloadRequested && acknowledged);

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = QUOTE_REQUEST_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setDownloadRequested(true);
    // Safari may consume the blob after the click handler has returned.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Copied to clipboard.');
    } catch {
      setCopyStatus('Copy is unavailable. Please download the request instead.');
    }
  }

  return (
    <>
      {requiresAttachment ? (
        <div className="notice" role="note" aria-labelledby="attachment-heading" id="attachment-instructions">
          <FileText size={20} />
          <div>
            <strong id="attachment-heading">Attachment required before sending</strong>
            <p>The full request is too long to include in the email draft. Download the complete request and attach it yourself; files are not attached automatically.</p>
            <p>First download the request. Then confirm below that you saved the file and will attach it before sending. Both steps are required to open an email draft.</p>
          </div>
        </div>
      ) : (
        <p className="small">The full request will be included in your email draft. No attachment is required.</p>
      )}
      <div className="review-buttons">
        <button className="button primary" onClick={download}><Download size={18} /> Download request</button>
        <button className="button outline" onClick={copy}><ClipboardList size={18} /> Copy request</button>
      </div>
      <p role="status" className="small">{copyStatus}</p>
      {requiresAttachment && (
        <>
          <label style={{ flexDirection: 'row', alignItems: 'center', margin: '16px 0' }}>
            <input
              type="checkbox"
              disabled={!downloadRequested}
              checked={acknowledged}
              onChange={event => setAcknowledged(event.target.checked)}
              aria-describedby="attachment-instructions"
              style={{ flexShrink: 0 }}
            />
            I saved the complete request file and will attach it before sending.
          </label>
          {downloadRequested && (
            <p role="status" className="small">Download requested. Check that the file was saved, then attach it to the draft yourself.</p>
          )}
        </>
      )}
      {ready ? (
        <a className="button outline full" href={href} aria-describedby={requiresAttachment ? 'attachment-instructions' : undefined}>
          <Mail size={18} /> Open email to {details.branch}
        </a>
      ) : (
        <button className="button outline full" disabled aria-describedby="attachment-instructions">
          <Mail size={18} /> Open email to {details.branch}
        </button>
      )}
      <p className="small">
        Your email app opens a draft. Check it and press Send yourself. Nothing is sent by this website.
        {requiresAttachment && ' Attach the complete request file before sending.'}
        {' '}Email: <strong>{email}</strong>
      </p>
    </>
  );
}

export function QuotePage({ cart, setCart, details, setDetails, onBrowse }: QuotePageProps) {
  const [step, setStep] = useState(1);
  const [contactErrors, setContactErrors] = useState<ContactValidationErrors>({});
  const today = localDateString(new Date());
  const [invalidQuantities, setInvalidQuantities] = useState<ReadonlySet<string>>(() => new Set());
  const heading = useRef<HTMLHeadingElement>(null);
  const text = quoteText(cart, details);
  const selectedBranch = branches.find(branch => branch.name === details.branch)!;
  const hasInvalidQuantities = cart.some(line => invalidQuantities.has(line.id));

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  function update<Key extends keyof QuoteDetails>(key: Key, value: QuoteDetails[Key]) {
    setDetails({ ...details, [key]: value });
    if (key === 'fulfilment') {
      // Delivery's control (and its native custom validity) unmounts on pickup.
      setContactErrors(previous => ({ ...previous, address: undefined }));
    }
  }

  function contactInput(field: ContactValidationField) {
    function validate(input: HTMLInputElement | HTMLTextAreaElement) {
      const error = validateContactDetails({ ...details, [field]: input.value }, new Date())[field];
      input.setCustomValidity(error ?? '');
      return error;
    }

    return {
      name: field,
      'aria-invalid': contactErrors[field] ? true : undefined,
      'aria-describedby': contactErrors[field] ? `quote-${field}-error` : undefined,
      onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        update(field, event.currentTarget.value);
        // Clear corrected errors immediately, but announce new ones only after
        // blur or submission rather than while someone is still typing.
        if (!validate(event.currentTarget)) {
          setContactErrors(previous => ({ ...previous, [field]: undefined }));
        }
      },
      onBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const error = validate(event.currentTarget);
        setContactErrors(previous => ({ ...previous, [field]: error }));
      },
    };
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const now = new Date();
    const errors = validateContactDetails(details, now);
    for (const field of contactValidationFields) {
      const input = form.elements.namedItem(field);
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        if (field === 'date' && input instanceof HTMLInputElement) input.min = localDateString(now);
        input.setCustomValidity(errors[field] ?? '');
      }
    }
    setContactErrors(errors);
    // The form defers automatic checking so even stale custom errors and date
    // bounds are refreshed first. Native required/email/min checks still run.
    if (!form.reportValidity()) return;
    setDetails(normalizeContactDetails(details));
    setStep(3);
  }

  function quantity(id: string, value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 9999) return;
    setCart(cart.map(line => line.id === id ? { ...line, quantity: value } : line));
  }

  function quantityValidity(id: string, valid: boolean) {
    setInvalidQuantities(previous => {
      if (previous.has(id) === !valid) return previous;
      const next = new Set(previous);
      if (valid) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!cart.length) {
    return (
      <section className="container empty-quote">
        <ClipboardList size={52} />
        <h1>Your quote list is empty</h1>
        <p>Find what you need and tap “Add to quote”. No prices to guess, no payment required.</p>
        <button className="button primary" onClick={onBrowse}>Browse products <ArrowRight size={18} /></button>
      </section>
    );
  }

  return (
    <section className="container quote-page">
      <button className="text-button" onClick={onBrowse}><ArrowLeft size={17} /> Continue browsing</button>
      <div className="section-heading">
        <div>
          <span className="eyebrow">LET’S GET YOUR JOB SORTED</span>
          <h1 ref={heading} tabIndex={-1}>
            {step === 1 ? 'Your quote list' : step === 2 ? 'A few job details' : 'Review & send your request'}
          </h1>
        </div>
        <span className="muted">No payment. No commitment.</span>
      </div>
      <ol className="steps">
        {['Check your list', 'Your details', 'Review & send'].map((label, index) => (
          <li key={label} className={step >= index + 1 ? 'active' : ''} aria-current={step === index + 1 ? 'step' : undefined}>
            <span>{step > index + 1 ? <Check size={16} /> : index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div className="quote-layout">
        <div>
          {step === 1 && (
            <div className="quote-lines">
              {cart.map(line => {
                const product = products.find(product => product.id === line.id)!;
                return (
                  <article className="quote-line" key={product.id}>
                    <div className="cart-image"><ProductImage product={product} /></div>
                    <div className="cart-product">
                      <span className="eyebrow">{product.brand}</span>
                      <h3>{product.name}</h3><p>{product.pack}</p>
                      <small>Ref: {product.sourceSku ?? product.id}</small>
                    </div>
                    <div className="cart-controls">
                      <QuantityInput
                        value={line.quantity}
                        onChange={value => quantity(product.id, value)}
                        label={`Quantity for ${product.name}`}
                        onValidityChange={valid => quantityValidity(product.id, valid)}
                        stepperLabels={{ decrease: `Decrease ${product.name}`, increase: `Increase ${product.name}` }}
                      />
                      <button className="text-button remove" onClick={() => setCart(cart.filter(item => item.id !== product.id))}>
                        <Trash2 size={15} /> Remove<span className="sr-only"> {product.name}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
              <p className="notice"><FileText size={20} /> Need something else? Add unlisted products or special requirements in the next step.</p>
            </div>
          )}
          {step === 2 && (
            <form id="quote-details" className="details-form" noValidate onSubmit={submitDetails}>
              <h2>How can we reach you?</h2>
              <p>Required fields are marked *. Contact details stay in this tab only; refreshing or closing it clears them. Download your request before leaving.</p>
              <div className="form-grid">
                <div>
                  <label>Your name *
                    <input autoComplete="name" required maxLength={100} value={details.name} {...contactInput('name')} />
                  </label>
                  {contactErrors.name && <p id="quote-name-error" className="error" role="alert">{contactErrors.name}</p>}
                </div>
                <label>Business name
                  <input autoComplete="organization" maxLength={120} value={details.company} onChange={event => update('company', event.target.value)} />
                </label>
                <label>Email *
                  <input autoComplete="email" type="email" required maxLength={150} value={details.email} onChange={event => update('email', event.target.value)} />
                </label>
                <div>
                  <label>Phone *
                    <input
                      autoComplete="tel" type="tel" required
                      title="Enter 6 to 15 digits, using only +, spaces, parentheses or hyphens for formatting."
                      value={details.phone} {...contactInput('phone')}
                    />
                  </label>
                  {contactErrors.phone && <p id="quote-phone-error" className="error" role="alert">{contactErrors.phone}</p>}
                </div>
                <label>Trade account (optional)
                  <input maxLength={60} value={details.account} onChange={event => update('account', event.target.value)} />
                </label>
                <label>Preferred branch *
                  <select value={details.branch} onChange={event => update('branch', event.target.value)}>
                    {branches.map(branch => <option key={branch.name}>{branch.name}</option>)}
                  </select>
                </label>
              </div>
              <h2>Getting it to your job</h2>
              <fieldset className="fulfilment">
                <legend>Collection or delivery</legend>
                <label>
                  <input type="radio" name="fulfilment" checked={details.fulfilment === 'pickup'} onChange={() => update('fulfilment', 'pickup')} />
                  <MapPin size={20} /> Collect from branch
                </label>
                <label>
                  <input type="radio" name="fulfilment" checked={details.fulfilment === 'delivery'} onChange={() => update('fulfilment', 'delivery')} />
                  <Truck size={20} /> Deliver to site
                </label>
              </fieldset>
              {details.fulfilment === 'delivery' && (
                <>
                  <label><span id="quote-address-label">Delivery address *</span>
                    <textarea aria-labelledby="quote-address-label" autoComplete="street-address" required maxLength={400} value={details.address} {...contactInput('address')} />
                  </label>
                  {contactErrors.address && <p id="quote-address-error" className="error" role="alert">{contactErrors.address}</p>}
                </>
              )}
              <label>Preferred date (optional)
                <input type="date" min={today} value={details.date} {...contactInput('date')} />
              </label>
              {contactErrors.date && <p id="quote-date-error" className="error" role="alert">{contactErrors.date}</p>}
              <label>Other products or job notes
                <textarea
                  maxLength={2000} rows={4}
                  placeholder="Can’t find a product? Add the name, size and quantity here. Include any site access requirements."
                  value={details.notes} onChange={event => update('notes', event.target.value)}
                />
              </label>
              <p className="small">
                The branch will confirm stock, price, timing and any delivery charges.{' '}
                <a href="https://lyndons.com.au/privacy-policy" target="_blank" rel="noreferrer">Lyndons privacy policy <ExternalLink size={12} /></a>
              </p>
            </form>
          )}
          {step === 3 && (
            <div className="review-panel">
              <span className="review-icon"><CheckCircle2 size={30} /></span>
              <h2>Ready for your local team.</h2>
              <p className="notice"><strong>Not sent yet.</strong> This preview prepares your request; it does not submit it automatically.</p>
              <p>Download or copy your full list, then share it with <strong>Lyndons {details.branch}</strong>. No order is placed until the branch confirms it with you.</p>
              <div className="review-summary">
                <h3>{cart.length} product {cart.length === 1 ? 'line' : 'lines'}</h3>
                {cart.map(line => (
                  <p key={line.id}><span>{products.find(product => product.id === line.id)!.name}</span><strong>× {line.quantity}</strong></p>
                ))}
                <hr />
                <p><span>Preferred branch</span><strong>Lyndons {details.branch}</strong></p>
                <p><span>{details.name} · {details.company || 'Personal enquiry'}</span></p>
                <p><span>{details.email}<br />{details.phone}</span></p>
                <p><span>{details.fulfilment === 'pickup' ? `Collect from ${details.branch}` : `Deliver to: ${details.address}`}</span></p>
                {details.account && <p><span>Trade account: {details.account}</span></p>}
                {details.date && <p><span>Requested date: {details.date} (to be confirmed)</span></p>}
                {details.notes && <p className="notes-review">{details.notes}</p>}
              </div>
              <EmailHandoff key={text} text={text} details={details} email={selectedBranch.email} />
              <a className="text-button" href={selectedBranch.url} target="_blank" rel="noreferrer">{details.branch} contact details <ExternalLink size={15} /></a>
            </div>
          )}
        </div>
        <aside className="quote-summary">
          <ClipboardList size={26} /><h2>Your job, sorted.</h2>
          <div className="summary-row"><span>Preferred branch</span><strong>Lyndons {details.branch}</strong></div>
          <div className="summary-row"><span>Product lines</span><strong>{cart.length}</strong></div>
          <div className="summary-row"><span>Total units</span><strong>{cart.reduce((sum, line) => sum + line.quantity, 0)}</strong></div>
          <hr />
          <p><Check size={16} /> Branch-confirmed pricing</p>
          <p><Check size={16} /> Collection or site delivery</p>
          <p><Check size={16} /> No online payment</p>
          {step === 1 && (
            <>
              {hasInvalidQuantities && <p id="quantity-help" className="error">Correct or remove invalid quantities to continue. Totals use the last valid quantities.</p>}
              <button
                className="button primary full" disabled={hasInvalidQuantities}
                aria-describedby={hasInvalidQuantities ? 'quantity-help' : undefined}
                onClick={() => { if (!hasInvalidQuantities) setStep(2); }}
              >Add your details <ArrowRight size={17} /></button>
            </>
          )}
          {step === 2 && (
            <button type="submit" form="quote-details" className="button primary full">Review request <ArrowRight size={17} /></button>
          )}
          {step > 1 && (
            <button className="text-button" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> {step === 2 ? 'Back to your list' : 'Edit your details'}
            </button>
          )}
          <small>A quote request isn’t an order. Your branch will confirm the details.</small>
        </aside>
      </div>
    </section>
  );
}