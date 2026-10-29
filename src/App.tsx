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
      <LycorisSpecimen name="Tenet" heroOnly scrollDriven sceneScroll={0.85} className="tenet-hero" heroOverlay={<>
        <header className="hero-header"><a className="wordmark" href="#home" aria-label="Tenet home">tenet</a><span className="hero-context">Security deposit & FDR management</span></header>
        <FloatingDock active={0} items={[
          { title: 'Home', icon: Home, onSelect: () => { window.location.hash = 'home'; window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } },
          { title: 'Dashboard', icon: LayoutDashboard, onSelect: () => { window.location.hash = 'dashboard'; } },
          { title: 'Records', icon: Files, onSelect: () => { window.location.hash = 'records'; } },
        ]} />
        {[
          { title: 'Institution-wise records', description: 'Bank details, deposit amounts and supporting documents, together.', label: '01 / RECORDS' },
          { title: 'Submission & scrutiny', description: 'Track missing documents, corrections and pending reviews.', label: '02 / REVIEW' },
          { title: 'Maturity & renewal', description: 'Follow deadlines and link renewed instruments to their original records.', label: '03 / DEADLINES' },
          { title: 'Verification with evidence', description: 'Keep submitted details separate from independently confirmed information.', label: '04 / VERIFICATION' },
          { title: 'Authorized release', description: 'Review release and refund requests with a complete action history.', label: '05 / APPROVALS' },
        ].map((scene, index) => <section key={scene.label} className={`tenet-scroll-scene scene-${index + 1}`} data-sc={index + 1} data-fx="rise" data-d="0.15" style={{ opacity: 0, visibility: 'hidden' }}>
          <p className="scroll-scene-label">{scene.label}</p><h2>{scene.title}</h2><p className="scroll-scene-description">{scene.description}</p>
        </section>)}
        <div className="hero-bottom"><div data-sc="0" data-fx="fade" data-d="0"><AnimatedGroup preset="slide"><p className="hero-description">Institutional deposits.<br /><span>From submission to release.</span></p></AnimatedGroup></div>
          <AnimatedGroup preset="slide"><a className="primary-button" href="#dashboard">Open dashboard <ArrowUpRight size={17} aria-hidden="true" /></a></AnimatedGroup>
        </div><span className="hero-footnote" data-sc="0" data-fx="fade" data-d="0">SCROLL TO EXPLORE</span>
      </>} />
    </main>}
  </>;
}
