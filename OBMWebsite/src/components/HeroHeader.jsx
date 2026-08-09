import { useRef, useEffect, useState } from 'react';
import logo from '../assets/one_man_band_trnsp-2.png';

// Anchor targets match the ids set on each section component.
const NAV_ITEMS = [
  { label: 'Featured Instrument', target: 'featured-instrument' },
  { label: 'Latest Album', target: 'latest-album' },
  { label: 'Live Shows', target: 'live-shows' },
  { label: 'About', target: 'about' },
  { label: 'Stage', target: 'stage' },
];

export default function HeroHeader() {
  const borderRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // Track the window scroll position for the curtain fade effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMove = (e) => {
    const node = borderRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) / rect.width) * 100;
    const gy = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty('--gx', `${gx}%`);
    node.style.setProperty('--gy', `${gy}%`);
  };

  // Smooth scroll to a section. Handled in JS (rather than relying only on
  // href anchors) so we can honour prefers-reduced-motion and still update
  // the URL hash for shareable/bookmarkable links.
  const handleNavClick = (e, target) => {
    e.preventDefault();
    const node = document.getElementById(target);
    if (!node) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    if (window.history?.replaceState) {
      window.history.replaceState(null, '', `#${target}`);
    }
  };

  // Calculate dynamic styles for the curtain effect. The hero panel is now
  // compact (~40vh, see .hero-curtain-container) so it fades out over a
  // shorter scroll distance than before, matching how quickly the
  // Instrument Specification panel now rises to cover it.
  const fadeOpacity = Math.max(1 - scrollY / 420, 0);
  const fadeScale = Math.max(1 - scrollY / 3000, 0.92);

  return (
    <div 
      className="hero-curtain-container" 
      style={{ opacity: fadeOpacity, transform: `scale(${fadeScale})` }}
    >
      <div className="inner-card-wrapper hero-intro">
        <div className="solid-bg-rect"></div>
        <div className="logo-border" ref={borderRef} onMouseMove={handleMove}>
          
          {/* New Diagonal Layout Wrapper */}
          <div className="hero-content diagonal-layout">
            
            <div className="hero-logo-cell">
              <img
                src={logo}
                alt="One Man Band Logo"
                className="logo-graphic"
              />
            </div>
            
            <div className="hero-slash-cell">
              <div className="slash-divider">/</div>
            </div>
            
            <div className="hero-text-cell">
              <div className="band-text-group">
                <span className="band-text band-text-line1">ONE MAN</span>
                <span className="band-text band-text-line2">BAND</span>
              </div>
            </div>

          </div>

        </div>

        {/* Section navigation — sits directly under the title/logo block.
            Deliberately quiet: small monospace caps, hairline separators and
            the existing green accent only on hover/focus, so it never
            competes with the wordmark above it. */}
        <nav className="hero-nav" aria-label="Section navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.target}
              href={`#${item.target}`}
              className="hero-nav-link"
              onClick={(e) => handleNavClick(e, item.target)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}