import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { asset } from '../lib/preview';
import { productsByCode } from '../lib/storefront-route';

const panels = [
  { label: 'Product resources', title: 'Check the details. Choose the right product.', description: 'Supplier catalogues and technical information, together in one place.', href: '#/catalogues', action: 'Browse catalogues & data sheets', image: productsByCode.get('SIKA212')?.image, alt: 'SikaGrout product example' },
  { label: 'Your local branch', title: 'Talk through your next job.', description: 'Confirm products, collection and delivery options with your Lyndons team.', href: '#/branches', action: 'Find a branch', image: asset('images/construction.webp'), alt: 'Construction work from the existing Lyndons website', photo: true },
  { label: 'Equipment catalogue', title: 'Explore the Flextool range.', description: 'The downloaded Volume 33 supplier catalogue is available in our document library. Branch availability needs confirmation.', href: '#/catalogues', action: 'View catalogue library' },
];

export function StorefrontUpdates() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [announcement, setAnnouncement] = useState('');
  const pointerPaused = useRef(paused);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => { if (motion.matches) setPaused(true); };
    const visibility = () => setHidden(document.hidden);
    motion.addEventListener('change', reduced);
    document.addEventListener('visibilitychange', visibility);
    return () => { motion.removeEventListener('change', reduced); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (paused || hovering || hidden) return;
    const timer = window.setInterval(() => setIndex(previous => (previous + 1) % panels.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, hovering, hidden]);

  function show(next: number) {
    const value = (next + panels.length) % panels.length;
    setIndex(value);
    setPaused(true);
    setAnnouncement(`Panel ${value + 1} of ${panels.length}: ${panels[value].title}`);
  }

  return <section className="trade-updates" aria-label="Updates and useful information" aria-roledescription="carousel"
    onMouseEnter={() => { if (matchMedia('(hover: hover)').matches) setHovering(true); }} onMouseLeave={() => setHovering(false)}
    onFocusCapture={() => setPaused(true)}>
    <div className="trade-updates-top"><strong>Updates & useful information</strong><span>Product resources and branch information</span></div>
    <div className="trade-updates-panels">
      {panels.map((panel, position) => <article key={panel.title} hidden={position !== index} role="group" aria-roledescription="slide" aria-label={`${position + 1} of ${panels.length}`}>
        <div><span className="trade-kicker">{panel.label}</span><h2>{panel.title}</h2><p>{panel.description}</p><a className="trade-button trade-primary" href={panel.href}>{panel.action} <ArrowRight size={16} /></a></div>
        {panel.image ? <img src={panel.image} alt={panel.alt} width="435" height="270" className={panel.photo ? 'trade-site-photo' : ''} /> : <div className="trade-catalogue-art" aria-hidden="true"><span>Supplier catalogue</span><strong>Flextool</strong><span>Volume 33</span><small>Downloaded PDF</small></div>}
      </article>)}
    </div>
    <div className="trade-updates-controls">
      <button type="button" onPointerDown={() => { pointerPaused.current = paused; }} onClick={event => {
        // Pointer focus also pauses rotation. Toggle the pre-focus state so a
        // first click on “Pause” cannot inadvertently restart the carousel.
        setPaused(event.detail ? !pointerPaused.current : !paused);
      }}>{paused ? 'Play updates' : 'Pause updates'}</button>
      <div className="trade-slide-dots">{panels.map((panel, position) => <button key={panel.title} type="button" aria-label={`Show update ${position + 1}`} aria-pressed={position === index} onClick={() => show(position)}><span aria-hidden="true" /></button>)}</div>
      <span>{index + 1} / {panels.length}</span>
      <button type="button" aria-label="Previous update" onClick={() => show(index - 1)}><ArrowLeft size={17} /></button>
      <button type="button" aria-label="Next update" onClick={() => show(index + 1)}><ArrowRight size={17} /></button>
    </div>
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
  </section>;
}