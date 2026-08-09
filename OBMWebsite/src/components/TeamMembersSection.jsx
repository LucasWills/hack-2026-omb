import { useRef, useState } from 'react';
import memberPhotoPlaceholder from '../assets/shinji.jpeg';
import useScrollReveal from './useScrollReveal';
import Modal from './Modal';

// Data-driven content
const teamMembers = [
  {
    id: 2,
    name: "Lucas Wills",
    role: "Yabai",
    bio: "Placeholder description detailing Lucas's contributions to the collective. Responsible for overseeing the core system architecture and prototyping workflows.",
    photo: memberPhotoPlaceholder
  },
  {
    id: 3,
    name: "Mussie Yigzaw",
    role: "Yabai",
    bio: "Placeholder description detailing Mussie's contributions to the collective. Focused on acoustic resonance testing, signal flow, and structural integrity.",
    photo: memberPhotoPlaceholder
  },
  {
    id: 1,
    name: "Asher Vicera",
    role: "Yabai",
    bio: "Placeholder description detailing Asher's contributions to the collective. Engineered the live telemetry pipelines, UI development, and data-driven visualizers.",
    photo: memberPhotoPlaceholder
  }
];

function MemberCard({ member, onClick }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
    card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--my', `${(y / rect.height) * 100}%`);
  };

  const handleLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      className="member-card clickable"
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => onClick(member)}
    >
      <div
        className="member-card-photo"
        style={{ backgroundImage: `url(${member.photo})` }}
      />
      <div className="member-card-scrim" />
      <div className="member-card-sheen" />
      <div className="member-card-info">
        <span className="member-role">{member.role}</span>
        <h3 className="member-name">{member.name}</h3>
      </div>
    </div>
  );
}

export default function TeamMembersSection() {
  const [ref, isVisible] = useScrollReveal();
  const [selectedMember, setSelectedMember] = useState(null);

  const openMember = (member) => setSelectedMember(member);
  const closeMember = () => setSelectedMember(null);

  return (
    <>
      <div
        className={`content-section team-members-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
        ref={ref}
      >
        <div className="section-header-block">
          <h2 className="section-main-title">The Collective</h2>
          <p className="section-subtitle">Meet the minds driving the project forward.</p>
        </div>

        <div className="members-grid">
          {teamMembers.map((member) => (
            <MemberCard member={member} key={member.id} onClick={openMember} />
          ))}
        </div>
      </div>

      <Modal isOpen={!!selectedMember} onClose={closeMember}>
        {selectedMember && (
          <div className="member-modal-layout">
            <img src={selectedMember.photo} alt={selectedMember.name} className="member-modal-photo" />
            
            <div className="member-modal-info">
              <span className="member-role" style={{ fontSize: '1rem', padding: '5px 12px' }}>{selectedMember.role}</span>
              <h2 className="modal-title" style={{ textAlign: 'left', marginTop: '1rem' }}>{selectedMember.name}</h2>
              <div className="modal-divider"></div>
              <p className="modal-bio-text">
                {selectedMember.bio}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}