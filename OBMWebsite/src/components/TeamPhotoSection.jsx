import teamPhotoPlaceholder from '../assets/shinji.jpeg';

export default function TeamPhotoSection() {
  return (
    <div className="content-section team-photo-section-bg">
      <div className="section-header-block">
        <h2 className="section-main-title">Behind the Works</h2>
        <p className="section-subtitle">A glimpse into the engineering, prototyping, and assembly process behind the build.</p>
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