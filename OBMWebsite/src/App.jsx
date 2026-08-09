import HeroHeader from './components/HeroHeader';
import InstrumentSection from './components/InstrumentSection';
import SetlistSection from './components/SetlistSection';
import PerformanceSection from './components/PerformanceSection';
import TeamPhotoSection from './components/TeamPhotoSection';
import TeamMembersSection from './components/TeamMembersSection';
import VisualizerSection from './components/VisualizerSection';

export default function App() {
  return (
    <div className="bg-strip">
      <div className="main-layout-container">
        <HeroHeader />
        
        {/* We group the rest of the sections together so they can seamlessly scroll OVER the sticky Hero header */}
        <div className="content-curtain-reveal">
          <InstrumentSection />
          <SetlistSection />
          <PerformanceSection />
          <TeamPhotoSection />
          <TeamMembersSection />
          <VisualizerSection />
        </div>
      </div>
    </div>
  );
}