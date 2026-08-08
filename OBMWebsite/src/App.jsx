import HeroHeader from './components/HeroHeader';
import InstrumentSection from './components/InstrumentSection';
import TeamPhotoSection from './components/TeamPhotoSection';
import TeamMembersSection from './components/TeamMembersSection';

export default function App() {
  return (
    <div className="bg-strip">
      <div className="main-layout-container">
        <HeroHeader />
        <InstrumentSection />
        <TeamPhotoSection />
        <TeamMembersSection />
      </div>
    </div>
  );
}