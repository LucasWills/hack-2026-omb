import instrumentImage from '../assets/shinji.jpeg';

export default function InstrumentSection() {
  return (
    <div className="content-section instrument-section-bg">
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
  );
}