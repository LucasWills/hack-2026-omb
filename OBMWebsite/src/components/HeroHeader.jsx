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

  // Smooth scroll to a section. Includes an offset (-80px) so the
  // persistent sticky nav doesn't cover the section header when you land.
  const handleNavClick = (e, target) => {
    e.preventDefault();
    const node = document.getElementById(target);
    if (!node) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const y = node.getBoundingClientRect().top + window.scrollY - 80;
    
    window.scrollTo({
      top: y,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    
    if (window.history?.replaceState) {
      window.history.replaceState(null, '', `#${target}`);
    }
  };

  // Calculate dynamic styles for the curtain effect.
  const fadeOpacity = Math.max(1 - scrollY / 420, 0);
  const fadeScale = Math.max(1 - scrollY / 3000, 0.92);

  return (
    <>
      {/* Persistent Nav: Sits globally fixed at the top of the screen */}
      <nav className="site-persistent-nav" aria-label="Section navigation">
        <div className="persistent-nav-container">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.target}
              href={`#${item.target}`}
              className="persistent-nav-link"
              onClick={(e) => handleNavClick(e, item.target)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Hero Curtain: Fades out and stays sticky as you scroll */}
      <div 
        className="hero-curtain-container" 
        style={{ opacity: fadeOpacity, transform: `scale(${fadeScale})` }}
      >
        <div className="inner-card-wrapper hero-intro">
          <div className="logo-border" ref={borderRef} onMouseMove={handleMove}>
            
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
        </div>
      </div>
    </>
  );
}