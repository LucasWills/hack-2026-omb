import instrumentImage from '../assets/TeamInstrument.png';
import useScrollReveal from './useScrollReveal';

// Data-driven content
const instrumentSpecs = {
  bodyMaterial: "PLA / Birch Wood",
  configuration: "13-Key Layout",
  electronics: "Active Amplifier / 150MHz MCU",
  finish: "Raw / Glossy"
};

export default function InstrumentSection() {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      id="featured-instrument"
      className={`content-section instrument-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
    >
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
            <li><span>Body Material:</span> {instrumentSpecs.bodyMaterial}</li>
            <li><span>Configuration:</span> {instrumentSpecs.configuration}</li>
            <li><span>Electronics:</span> {instrumentSpecs.electronics}</li>
            <li><span>Finish:</span> {instrumentSpecs.finish}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}