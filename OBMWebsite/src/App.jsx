import logo from './assets/one_man_band_trnsp-2.png';

export default function App() {
  return (
    <div className="logo-border">
      <div className="hero-content">
        {/* Top-Left: Logo / Graphic element */}
        <img 
          src={logo} 
          alt="One Man Band Logo" 
          className="logo-graphic"
        />

        {/* Center: The diagonal slash separator */}
        <div className="slash-divider">/</div>

        {/* Bottom-Right: Clean text layout */}
        <div className="band-text-group">
          <span className="band-text">ONE MAN BAND</span>
        </div>
      </div>
    </div>
  );
}