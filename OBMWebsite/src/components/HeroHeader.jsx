import { useRef } from 'react';
import logo from '../assets/one_man_band_trnsp-2.png';

export default function HeroHeader() {
  const borderRef = useRef(null);

  const handleMove = (e) => {
    const node = borderRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) / rect.width) * 100;
    const gy = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty('--gx', `${gx}%`);
    node.style.setProperty('--gy', `${gy}%`);
  };

  return (
    <div className="inner-card-wrapper hero-intro">
      <div className="solid-bg-rect"></div>
      <div className="logo-border" ref={borderRef} onMouseMove={handleMove}>
        <div className="hero-content">
          <img
            src={logo}
            alt="One Man Band Logo"
            className="logo-graphic"
          />
          <div className="slash-divider">/</div>
          <div className="band-text-group">
            <span className="band-text">ONE MAN BAND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
