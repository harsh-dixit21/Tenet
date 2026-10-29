import { useEffect, useState } from 'react';
import { ArrowUpRight, Home, LayoutDashboard, Files } from 'lucide-react';
import { AnimatedGroup } from '@/components/motion-primitives/animated-group';
import LycorisSpecimen from '@/components/ui/lycoris-specimen';
import { FloatingDock } from '@/components/ui/floating-dock';
import Dashboard from '@/components/dashboard';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#home');
  useEffect(() => {
    const update = () => { setRoute(window.location.hash || '#home'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <><a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    {route === '#dashboard' || route === '#records' ? <Dashboard initialTab={route === '#records' ? 'Records' : 'Overview'} /> : <main id="main" tabIndex={-1}>
      <LycorisSpecimen name="Tenet" heroOnly className="tenet-hero" heroOverlay={<>
        <header className="hero-header"><a className="wordmark" href="#home" aria-label="Tenet home">tenet</a><span className="hero-context">Security deposit & FDR management</span></header>
        <FloatingDock active={0} items={[
          { title: 'Home', icon: Home, onSelect: () => { window.location.hash = 'home'; } },
          { title: 'Dashboard', icon: LayoutDashboard, onSelect: () => { window.location.hash = 'dashboard'; } },
          { title: 'Records', icon: Files, onSelect: () => { window.location.hash = 'records'; } },
        ]} />
        <div className="hero-bottom"><AnimatedGroup preset="slide"><p className="hero-description">Institutional deposits.<br /><span>From submission to release.</span></p></AnimatedGroup>
          <AnimatedGroup preset="slide"><a className="primary-button" href="#dashboard">Open dashboard <ArrowUpRight size={17} aria-hidden="true" /></a></AnimatedGroup>
        </div><span className="hero-footnote">TENET / 2026</span>
      </>} />
    </main>}
  </>;
}
