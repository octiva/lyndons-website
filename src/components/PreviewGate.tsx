import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, HardHat, LockKeyhole, MapPin } from 'lucide-react';
import { asset } from '../lib/preview';
export function Brand({ light = false }: { light?: boolean }) { return <img className="brand" src={asset(light ? 'images/logo-light.svg' : 'images/logo.svg')} alt="Lyndons" width="190" height="42" />; }
export function PreviewGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [show, setShow] = useState(false);
  async function unlock(event: FormEvent) {
    event.preventDefault();
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hash = [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
    if (hash !== '53d224100379cc35a7b9ed0ad55776f4d218d5a9a06ae4a077e4a029da45bb33') { setError('That password isn’t right. Please try again.'); return; }
    try { sessionStorage.setItem('lyndons-preview', 'open'); } catch { /* Keep access in memory if storage is blocked. */ }
    onUnlock();
  }
  return <main className="gate"><div className="gate-story"><Brand light /><div className="gate-copy"><span className="eyebrow light">BUILT FOR THE WAY YOU WORK</span><h1>Less searching.<br />More building.</h1><p>Your next job starts here. A simpler way to find the right supplies and get a quote from your local team.</p><div className="gate-points"><span><HardHat /> Made for the trade</span><span><MapPin /> Local people. Real advice.</span></div></div><span className="gate-foot">LYNDONS · BUILDING & CONSTRUCTION SUPPLIES</span></div><section className="gate-panel"><span className="preview-badge"><span /> WEBSITE PREVIEW</span><div className="lock-icon"><LockKeyhole size={27} /></div><h2>A better way to<br />get the job started.</h2><p>Take a look around the new Lyndons website.<br />Enter your preview password to get started.</p><form onSubmit={unlock}><label htmlFor="password">Preview password</label><div className="password-field"><input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required aria-describedby={error ? 'password-error' : undefined} aria-invalid={!!error} /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button></div>{error && <p id="password-error" className="error" role="alert">{error}</p>}<button className="button primary full" type="submit">Explore the website <ArrowRight size={19} /></button></form><p className="gate-disclaimer"><LockKeyhole size={14} /> Preview access only. This screen is not secure authentication. Please don’t enter sensitive information.</p></section></main>;
}