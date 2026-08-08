import logo from '../assets/one_man_band_trnsp-2.png';

export default function HeroHeader() {
  return (
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
  );
}