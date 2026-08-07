import logo from './assets/one_man_band_trnsp-2.png';
import instrumentImage from './assets/shinji.jpeg';

export default function App() {
  return (
    <div className="bg-strip">
      <div className="main-layout-container">
        {/* Main Header Card */}
        <div className="inner-card-wrapper">
          <div className="solid-bg-rect"></div>
          <div className="logo-border">
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

        {/* Instrument Showcase & Specifications (Directly Below Logo) */}
        <div className="instrument-showcase-section">
          <div className="instrument-image-container">
            <img 
              src={instrumentImage} 
              alt="Instrument Showcase" 
              className="instrument-img" 
            />
          </div>

          <div className="specs-container">
            <h3 className="specs-title">Instrument Specifications</h3>
            <ul className="specs-list">
              <li><span>Configuration:</span> Custom Multi-Scale Build</li>
              <li><span>Body Material:</span> Treated Hardwood / Composite</li>
              <li><span>Electronics:</span> Active Preamp & Custom Pickups</li>
              <li><span>Finish:</span> Matte Dark Cyberpunk Finish</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}