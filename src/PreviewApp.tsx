import { Component, lazy, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { PreviewGate } from './components/PreviewGate';
import { sessionOpen } from './lib/preview';
import './App.css';

// Don't make the preview-password screen download the full catalogue.
const Storefront = lazy(() => import('./App'));
class CatalogueBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="container empty-quote"><h1>We couldn’t load the catalogue.</h1><p>Check your connection and try again. Your saved product list will stay on this device.</p><button className="button primary" onClick={() => location.reload()}>Try again</button></main>;
    return this.props.children;
  }
}
export default function PreviewApp() {
  const [unlocked, setUnlocked] = useState(sessionOpen);
  if (!unlocked) return <PreviewGate onUnlock={() => setUnlocked(true)} />;
  return <CatalogueBoundary><Suspense fallback={<main className="container empty-quote" aria-busy="true"><h1>Loading your supplies…</h1><p role="status">Opening the product catalogue.</p></main>}><Storefront /></Suspense></CatalogueBoundary>;
}