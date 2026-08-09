import teamPhotoPlaceholder from '../assets/shinji.jpeg';
import useScrollReveal from './useScrollReveal';

export default function TeamPhotoSection() {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      className={`content-section team-photo-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
    >
      <div className="section-header-block">
        <h2 className="section-main-title">Behind the Works</h2>
        <p className="section-subtitle">A glimpse into the engineering, prototyping, and assembly process behind the build.</p>
        
        {/* NEW: Engineering Description */}
        <div className="engineering-description">
          <p>
            Every instrument begins as a complex engineering challenge. From optimizing the structural geometry for weight distribution to mapping out the internal electronics for latency-free data transmission, each component is rigorously designed to balance technical performance, physical durability, and raw sonic character. 
          </p>
          <p>
            Through continuous CAD prototyping, material testing, and firmware iteration, the instrument evolves from an abstract technical concept into a complete, deeply expressive system capable of driving live telemetry and visual phenomena.
          </p>
        </div>
      </div>

      <div className="team-photo-container">
        <img
          src={teamPhotoPlaceholder}
          alt="Behind the Works Team Placeholder"
          className="team-photo-img"
        />
      </div>
    </div>
  );
}