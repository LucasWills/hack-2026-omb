import { useRef, useEffect, useState } from 'react';
import logo from '../assets/one_man_band_trnsp-2.png';

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

  // Calculate dynamic styles for the curtain effect (fades out completely after 600px of scroll)
  const fadeOpacity = Math.max(1 - scrollY / 600, 0);
  const fadeScale = Math.max(1 - scrollY / 4000, 0.92);

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
      </div>
    </div>
  );
}